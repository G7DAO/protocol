// src/services/bridge.service.ts
import { pool } from '../utils/db'; // Adjust the import path as necessary
import { bridgeConfig } from '../config'; // Adjust the import path as necessary

export async function getTransactionHistory(chain: string, address: string, limit: number, offset: number): Promise<object | string> {

  // switch statement blockchains

  if (!bridgeConfig[chain]) {
    chain = 'game7-testnet';
  }


  try {
    const query = `
    WITH game7_withdrawal AS (
      SELECT
          'WITHDRAWAL' AS type,
          label_data->'args'->>'position' AS position,
          label_data->'args'->>'callvalue' AS amount,
          ${bridgeConfig[chain].l3rleationship.parentNetworkChainId} AS parentNetworkChainId,
          ${bridgeConfig[chain].l3rleationship.childNetworkChainId} AS childNetworkChainId,
          transaction_hash AS childNetworkHash,
          block_timestamp AS childNetworkTimestamp,
          label_data->'args'->>'caller' AS from_address,
          label_data->'args'->>'destination' AS to_address,
          3600 AS challengePeriod,
          block_timestamp + 3600 AS claimableTimestamp,
          '${bridgeConfig[chain].l3Token}' AS token,
          block_timestamp AS block_timestamp
      FROM ${bridgeConfig[chain].l3TableName}
      WHERE
          label = 'seer' AND
          address = DECODE($1, 'hex') AND -- '0000000000000000000000000000000000000064' -- Game7 ArbOS L2 address
          label_type = 'event' AND
          label_name = 'L2ToL1Tx'
    ), arbirtrum_claims as (
      SELECT
          'CLAIM' AS type,
          transaction_hash,
          label_data->'args'->>'transactionIndex' AS position,
          label_data->'args'->>'l2Sender' AS from_address,    
          label_data->'args'->>'to' AS to_address,
          '${bridgeConfig[chain].l3Token}' AS token,
          label_data->'args'->>'value' AS amount,
          'from_l3_to_l2 claim' AS type,
          block_number,
          block_timestamp,
          true AS status
      FROM ${bridgeConfig[chain].l2TableName}
      WHERE
          label = 'seer' AND
          label_type = 'event' AND
          label_name = 'OutBoxTransactionExecuted' AND
          address = DECODE($2, 'hex') -- '64105c6C3D494469D5F21323F0E917563489d9f5' -- Arbitrum outbox address
    ), game7_withdrawal_failed as (
      SELECT
          'WITHDRAWAL' AS type,
          null AS position,
          NULL AS amount,
          ${bridgeConfig[chain].l3rleationship.parentNetworkChainId} AS parentNetworkChainId,
          ${bridgeConfig[chain].l3rleationship.childNetworkChainId} AS childNetworkChainId,
          transaction_hash AS childNetworkHash,
          block_timestamp AS childNetworkTimestamp,
          label_data->'args'->>'caller' AS from_address,
          null AS to_address,
          3600 AS challengePeriod,
          block_timestamp + 3600 AS claimableTimestamp,
          '${bridgeConfig[chain].l3Token}' AS token,
          NULL::double precision AS completionTimestamp,
          NULL::double precision AS parentNetworkTimestamp,
          NULL AS parentNetworkHash,
          false AS status,
          block_timestamp AS block_timestamp
      FROM ${bridgeConfig[chain].l3TableName}
      WHERE
          label = 'seer' AND
          label_type = 'tx_call' AND
          label_name = 'withdrawEth' AND
          ADDRESS = DECODE($1, 'hex') AND -- '0000000000000000000000000000000000000064' -- Game7 ArbOS L2 address
          (label_data->>'status' = '0' or label_data->'status' IS NULL)
    ), withdrawal_l3_l2 as (
      SELECT
          'WITHDRAWAL' AS type,
          game7_withdrawal.position AS position,
          game7_withdrawal.amount AS amount,
          game7_withdrawal.parentNetworkChainId AS parentNetworkChainId,
          game7_withdrawal.childNetworkChainId AS childNetworkChainId,
          game7_withdrawal.childNetworkHash AS childNetworkHash,
          game7_withdrawal.childNetworkTimestamp AS childNetworkTimestamp,
          game7_withdrawal.from_address AS from_address,
          game7_withdrawal.to_address AS to_address,
          game7_withdrawal.challengePeriod AS challengePeriod,
          game7_withdrawal.claimableTimestamp AS claimableTimestamp,
          game7_withdrawal.token as token,
          arbirtrum_claims.block_timestamp AS completionTimestamp,
          arbirtrum_claims.block_timestamp AS parentNetworkTimestamp,
          arbirtrum_claims.transaction_hash AS parentNetworkHash,
          true AS status,
          game7_withdrawal.block_timestamp AS block_timestamp
      FROM
          game7_withdrawal
          LEFT JOIN arbirtrum_claims ON game7_withdrawal.position = arbirtrum_claims.position
      UNION ALL
      SELECT
          *
      FROM
          game7_withdrawal_failed
    ), withdrawal_calls_arbitrum AS (
        SELECT
            transaction_hash,
            COALESCE(label_data -> 'args' ->> '_l1Token', '${bridgeConfig[chain].nativeToken}') AS token,
            '0x' || encode(origin_address, 'hex') AS origin_address,
            label_data -> 'args' ->> '_amount' AS amount,
            block_timestamp,
            label_data ->> 'status' AS status
        FROM
            ${bridgeConfig[chain].l2TableName} AS labels
        WHERE
            (address, label_name) IN (
                (DECODE($1, 'hex'), 'withdrawEth'),
                (DECODE($4, 'hex'), 'outboundTransfer')
            )
    ), withdrawal_events_arbitrum  AS (
        SELECT
            transaction_hash,
            label_data -> 'args' ->> 'position' AS position,
            label_data -> 'args' ->> 'callvalue' AS amount,
            label_data -> 'args' ->> 'destination' AS to_address
        FROM
            ${bridgeConfig[chain].l2TableName}
        WHERE
            address = DECODE($1, 'hex')
            AND label_name = 'L2ToL1Tx'
    ), arbitrum_withdraw AS (
        SELECT
            'WITHDRAWAL' AS type,
            we.position AS position,
            coalesce(wc.amount, we.amount) AS amount,
            ${bridgeConfig[chain].l2rleationship.parentNetworkChainId} AS parentNetworkChainId,
            ${bridgeConfig[chain].l2rleationship.childNetworkChainId} AS childNetworkChainId,
            wc.transaction_hash AS childNetworkHash,
            wc.block_timestamp AS childNetworkTimestamp,
            wc.origin_address AS from_address,
            we.to_address AS to_address,
            3600 AS challengePeriod,
            (wc.block_timestamp + 3600) AS claimableTimestamp,
            wc.block_timestamp AS block_timestamp,
            wc.token AS token,
            wc.status AS status
        FROM
            withdrawal_calls_arbitrum  wc
            JOIN withdrawal_events_arbitrum we ON we.transaction_hash = wc.transaction_hash
    ), ethereum_claims AS (
        SELECT
            'CLAIM' AS type,
            label_data -> 'args' ->> 'transactionIndex' AS position,
            transaction_hash,
            block_timestamp
        FROM
            ${bridgeConfig[chain].l1TableName}
        WHERE
            label_name = 'OutBoxTransactionExecuted'
            AND address = DECODE($3, 'hex')
    ), l2_to_l1_withdraw AS (
        SELECT
            'WITHDRAWAL' AS type,
            aw.position AS position,
            aw.amount AS amount,
            aw.parentNetworkChainId AS parentNetworkChainId,
            aw.childNetworkChainId AS childNetworkChainId,
            aw.childNetworkHash AS childNetworkHash,
            aw.childNetworkTimestamp AS childNetworkTimestamp,
            aw.from_address AS from_address,
            aw.to_address AS to_address,
            aw.challengePeriod AS challengePeriod,
            aw.claimableTimestamp AS claimableTimestamp,
            aw.token AS token,
            ec.block_timestamp AS completionTimestamp,
            ec.block_timestamp AS parentNetworkTimestamp,
            ec.transaction_hash AS parentNetworkHash,
            aw.status AS status,
            aw.block_timestamp AS block_timestamp
        FROM
            arbitrum_withdraw aw
            LEFT JOIN ethereum_claims ec ON aw.position = ec.position
    ), l2_to_l3_desposits as (
        SELECT
              'DEPOSIT' AS type,
              label_data -> 'args' ->> 'amount' AS amount,
              ${bridgeConfig[chain].l3rleationship.parentNetworkChainId} AS parentNetworkChainId,
              ${bridgeConfig[chain].l3rleationship.childNetworkChainId} AS childNetworkChainId,
              transaction_hash AS parentNetworkHash,
              block_timestamp AS parentNetworkTimestamp,
              block_timestamp AS completionTimestamp,
              '0x' || ENCODE(origin_address, 'hex') AS from_address,
              '0x' || ENCODE(origin_address, 'hex') AS to_address,
              '${bridgeConfig[chain].l3Token}' AS token,
              CASE
                    WHEN label_data ->> 'status' = '1' THEN true
                    ELSE false
              END AS isDeposit,
              block_timestamp
        FROM
              ${bridgeConfig[chain].l2TableName}
        WHERE
              label = 'seer'
              AND label_type = 'tx_call'
              AND label_name = 'depositERC20'
              AND address = DECODE($5, 'hex') -- e6470bb72291c39073aed67a30ff93b69c1f47de -- Arbitrum addressERC20Inbox
    ), l1_to_l2_deposit as (
       select * from ( 
       SELECT
              'DEPOSIT' AS type,
              label_data -> 'args' ->> '_amount' AS amount,
              ${bridgeConfig[chain].l2rleationship.parentNetworkChainId} AS parentNetworkChainId,
              ${bridgeConfig[chain].l2rleationship.childNetworkChainId} AS childNetworkChainId,
              transaction_hash AS parentNetworkHash,
              block_timestamp AS parentNetworkTimestamp,
              block_timestamp AS completionTimestamp,
              '0x' || ENCODE(origin_address, 'hex') AS from_address,
              label_data ->'args'->> '_to' AS to_address,
              label_data ->'args' ->> '_token' AS token,
              CASE
                    WHEN label_data ->> 'status' = '1' THEN true
                    ELSE false
              END AS isDeposit,
              block_timestamp
        FROM
            ${bridgeConfig[chain].l1TableName}
        WHERE
              label = 'seer'
              AND label_type = 'tx_call'
              AND label_name = 'outboundTransfer'
              AND ADDRESS = DECODE($6, 'hex') -- cE18836b233C83325Cc8848CA4487e94C6288264 -- Ethereum addressDeposit
        UNION ALL
        SELECT
          'DEPOSIT' AS type,
          NULL AS amount,
          ${bridgeConfig[chain].l2rleationship.parentNetworkChainId} AS parentNetworkChainId,
          ${bridgeConfig[chain].l2rleationship.childNetworkChainId} AS childNetworkChainId,
          transaction_hash AS parentNetworkHash,
          block_timestamp AS parentNetworkTimestamp,
          block_timestamp AS completionTimestamp,
          '0x' || ENCODE(origin_address, 'hex') AS from_address,
          '0x' || ENCODE(origin_address, 'hex') AS to_address,
          '${bridgeConfig[chain].nativeToken}' AS token,
          CASE
            WHEN label_data ->> 'status' = '1' THEN true
            ELSE false
          END AS isDeposit,
          block_timestamp
        FROM
          ${bridgeConfig[chain].l1TableName}
        WHERE
          label = 'seer'
          AND label_type = 'tx_call'
          AND label_name = 'depositEth'
          AND ADDRESS = DECODE($7, 'hex') -- cE18836b233C83325Cc8848CA4487e94C6288264 -- Ethereum addressDeposit
      ) as a
    ), full_history as (
          SELECT
                  json_build_object(
                          'type', type,
                          'amount', amount,
                          'parentNetworkChainId', parentNetworkChainId,
                          'childNetworkChainId', childNetworkChainId,
                          'parentNetworkHash', parentNetworkHash,
                          'parentNetworkTimestamp', parentNetworkTimestamp,
                          'completionTimestamp', completionTimestamp,
                          'from_address', from_address,
                          'to_address', to_address,
                          'token', token,
                          'isDeposit', isDeposit
                  ) AS data,
                  block_timestamp,
                  from_address,
                  to_address
          FROM
                  l2_to_l3_desposits
          
          UNION ALL
          SELECT
                  json_build_object(
                          'type', type,
                          'amount', amount,
                          'parentNetworkChainId', parentNetworkChainId,
                          'childNetworkChainId', childNetworkChainId,
                          'parentNetworkHash', parentNetworkHash,
                          'parentNetworkTimestamp', parentNetworkTimestamp,
                          'completionTimestamp', completionTimestamp,
                          'from_address', from_address,
                          'to_address', to_address,
                          'token', token,
                          'isDeposit', isDeposit
                  ) AS data,
                  block_timestamp,
                  from_address,
                  to_address
          FROM
                  l1_to_l2_deposit
          UNION ALL
          SELECT
                  json_build_object(
                          'type', type,
                          'position', position,
                          'amount', amount,
                          'parentNetworkChainId', parentNetworkChainId,
                          'childNetworkChainId', childNetworkChainId,
                          'parentNetworkHash', parentNetworkHash,
                          'childNetworkHash', childNetworkHash,
                          'parentNetworkTimestamp', parentNetworkTimestamp,
                          'childNetworkTimestamp', childNetworkTimestamp,
                          'completionTimestamp', completionTimestamp,
                          'from_address', from_address,
                          'to_address', to_address,
                          'challengePeriod', challengePeriod,
                          'claimableTimestamp', claimableTimestamp,
                          'token', token,
                          'status', status
                  ) AS data,
                  block_timestamp,
                  from_address,
                  to_address
          FROM
                  l2_to_l1_withdraw
          UNION ALL
          SELECT
                  json_build_object(
                          'type', type,
                          'position', position,
                          'amount', amount,
                          'parentNetworkChainId', parentNetworkChainId,
                          'childNetworkChainId', childNetworkChainId,
                          'parentNetworkHash', parentNetworkHash,
                          'childNetworkHash', childNetworkHash,
                          'parentNetworkTimestamp', parentNetworkTimestamp,
                          'childNetworkTimestamp', childNetworkTimestamp,
                          'completionTimestamp', completionTimestamp,
                          'from_address', from_address,
                          'to_address', to_address,
                          'challengePeriod', challengePeriod,
                          'claimableTimestamp', claimableTimestamp,
                          'token', token,
                          'status', status
                  ) AS data,
                  block_timestamp,
                  from_address,
                  to_address
          FROM
                  withdrawal_l3_l2
    )
    SELECT
      data
    FROM
      full_history
    WHERE
      from_address = $8
      or from_address = '0x' || ENCODE(DECODE(SUBSTRING($8 FROM 3), 'hex'), 'hex')
      or to_address = $8
      or to_address = '0x' || ENCODE(DECODE(SUBSTRING($8 FROM 3), 'hex'), 'hex')
    ORDER BY
      block_timestamp DESC
      OFFSET $9
      LIMIT $10
  `;
    const result = await pool.query(query, [bridgeConfig[chain].addressArbOS,
    bridgeConfig[chain].addressArbitrumOutBox,
    bridgeConfig[chain].addressEthereumOutbox,
    bridgeConfig[chain].addressL2GatewayRouter,
    bridgeConfig[chain].addressERC20Inbox,
    bridgeConfig[chain].addressL1GatewayRouter,
    bridgeConfig[chain].addressL1Inbox,
      address, offset, limit])
    // unpack the data from the result
    const data = result.rows.map((row: any) => row.data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw new Error(String(error));
  }
}