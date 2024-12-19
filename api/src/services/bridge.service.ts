// src/services/bridge.service.ts
import { pool } from '../utils/db'; // Adjust the import path as necessary
import { bridgeConfig } from '../config'; // Adjust the import path as necessary

export async function getTransactionHistory(chain: string, address: string, limit: number, offset: number): Promise<object | string> {

  // switch statement blockchains

  if (!bridgeConfig[chain]) {
    chain = 'game7-testnet';
  }


  // Define the protocol queries

  const protocolQueries = {
    'outboundTransfer': `
      SELECT
        transaction_hash,
        COALESCE(label_data -> 'args' ->> '_l1Token', '${bridgeConfig[chain].l3Token}') AS token,
        '0x' || encode(origin_address, 'hex') AS from_address,
        label_data -> 'args' ->> '_amount' AS amount,
        block_timestamp,
        label_data ->> 'status' AS status
      FROM
        ${bridgeConfig[chain].l3TableName} AS labels
    `
  }


  try {
    const query = `
    WITH 
    game7_token_info as (
      SELECT DISTINCT '0x' || ENCODE(address, 'hex') as address,
      label_data->'result'->>0 AS symbol
      FROM ${bridgeConfig[chain].l3TableName}
      WHERE label_name = 'symbol'
    ),
    arbitrum_token_info as (
      SELECT DISTINCT '0x' || ENCODE(address, 'hex') as address,
      label_data->'result'->>0 AS symbol
      FROM ${bridgeConfig[chain].l2TableName}
      WHERE label_name = 'symbol'
    ),
    ethereum_token_info as (
      SELECT DISTINCT '0x' || ENCODE(address, 'hex') as address,
      label_data->'result'->>0 AS symbol
      FROM ${bridgeConfig[chain].l1TableName}
      WHERE label_name = 'symbol'
    ),
    game7_withdrawal_calls AS (
        SELECT
            transaction_hash,
            COALESCE(label_data -> 'args' ->> '_l1Token', '${bridgeConfig[chain].l3Token}') AS token,
            '0x' || encode(origin_address, 'hex') AS from_address,
            label_data -> 'args' ->> '_amount' AS amount,
            block_timestamp,
            label_data ->> 'status' AS status
        FROM
            ${bridgeConfig[chain].l3TableName} AS labels
        WHERE
            (address, label_name) IN (
                (DECODE('${bridgeConfig[chain].addressArbOS}', 'hex'), 'withdrawEth'),
                (DECODE('${bridgeConfig[chain].addressL3GatewayRouter}', 'hex'), 'outboundTransfer')
            )
    ), game7_withdrawal_events AS (
        SELECT
            transaction_hash,
            label_data -> 'args' ->> 'position' AS position,
            label_data -> 'args' ->> 'callvalue' AS amount,
            label_data -> 'args' ->> 'destination' AS to_address
        FROM
            ${bridgeConfig[chain].l3TableName}
        WHERE
            address = DECODE('${bridgeConfig[chain].addressL3GatewayRouter}', 'hex')
            AND label_name = 'L2ToL1Tx'
    ), game7_withdrawal AS (
      SELECT
          'WITHDRAWAL' AS type,
          we.position AS position,
          coalesce(wc.amount, we.amount) AS amount,
          ${bridgeConfig[chain].l3rleationship.parentNetworkChainId} AS parentNetworkChainId,
          ${bridgeConfig[chain].l3rleationship.childNetworkChainId} AS childNetworkChainId,
          wc.transaction_hash AS childNetworkHash,
          wc.block_timestamp AS childNetworkTimestamp,
          wc.from_address AS from_address,
          we.to_address AS to_address,
          3600 AS challengePeriod,
          (wc.block_timestamp + 3600) AS claimableTimestamp,
          wc.block_timestamp AS block_timestamp,
          wc.token AS token,
          wc.status AS status
      FROM
          game7_withdrawal_calls wc
          LEFT JOIN game7_withdrawal_events we ON we.transaction_hash = wc.transaction_hash
    ),arbirtrum_claims as (
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
          address = DECODE('${bridgeConfig[chain].addressArbitrumOutBox}', 'hex') -- '64105c6C3D494469D5F21323F0E917563489d9f5' -- Arbitrum outbox address
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
    ), withdrawal_calls_arbitrum AS (
        SELECT
            transaction_hash,
            COALESCE(label_data -> 'args' ->> '_l1Token', '${bridgeConfig[chain].nativeToken}') AS token,
            '0x' || encode(origin_address, 'hex') AS from_address,
            label_data -> 'args' ->> '_amount' AS amount,
            block_timestamp,
            label_data ->> 'status' AS status
        FROM
            ${bridgeConfig[chain].l2TableName} AS labels
        WHERE
            (address, label_name) IN (
                (DECODE('${bridgeConfig[chain].addressArbOS}', 'hex'), 'withdrawEth'),
                (DECODE('${bridgeConfig[chain].addressL2GatewayRouter}', 'hex'), 'outboundTransfer')
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
            address = DECODE('${bridgeConfig[chain].addressArbOS}', 'hex')
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
            wc.from_address AS from_address,
            we.to_address AS to_address,
            3600 AS challengePeriod,
            (wc.block_timestamp + 3600) AS claimableTimestamp,
            wc.block_timestamp AS block_timestamp,
            wc.token AS token,
            wc.status AS status,
            false as isCctp
        FROM
            withdrawal_calls_arbitrum  wc
            JOIN withdrawal_events_arbitrum we ON we.transaction_hash = wc.transaction_hash
        UNION ALL
        select 
          'WITHDRAWAL' as type,
          'dasd' as position,
          label_data->'args'->>'amount' as amount,
          ${bridgeConfig[chain].l2rleationship.parentNetworkChainId} AS parentNetworkChainId,
          ${bridgeConfig[chain].l2rleationship.childNetworkChainId} AS childNetworkChainId,
          transaction_hash AS childNetworkHash,
          block_timestamp AS childNetworkTimestamp,
          '0x' || ENCODE(origin_address, 'hex') as to_address,
          '0x' || ENCODE(origin_address, 'hex') AS from_address, 
          3600 AS challengePeriod,
          (block_timestamp + 3600) AS claimableTimestamp,
          block_timestamp as block_timestamp,
          label_data->'args'->>'burnToken' as token,
          label_data->>'status' as status,
          true as isCctp
        from ${bridgeConfig[chain].l2TableName} -- arbitrum_one_labels
        where label_name = 'depositForBurn'
        and address = DECODE('${bridgeConfig[chain].AtbitrumCircleTokenMessenger}', 'hex') -- '0x00D2d23DEA90243D4f73cf088ea5666690299465' -- Arbitrum CircleTokenMessenger
        and label_data->'args'->>'destinationDomain' = '0' -- 0 is the destination domain for the ethereum chain
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
            AND address = DECODE('${bridgeConfig[chain].addressEthereumOutbox}', 'hex')
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
            aw.block_timestamp AS block_timestamp,
            aw.isCctp as isCctp,
            ${bridgeConfig[chain].l2rleationship.childNetworkChainId}  as originNetworkChainId,
            ${bridgeConfig[chain].l2rleationship.parentNetworkChainId} as destinationNetworkChainId
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
              true as isCctp,
              block_timestamp
        FROM
              ${bridgeConfig[chain].l2TableName}
        WHERE
              label = 'seer'
              AND label_type = 'tx_call'
              AND label_name = 'depositERC20'
              AND address = DECODE('${bridgeConfig[chain].addressERC20Inbox}', 'hex') -- e6470bb72291c39073aed67a30ff93b69c1f47de -- Arbitrum addressERC20Inbox
        UNION ALL
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
              true as isCctp,
              block_timestamp
        FROM
            ${bridgeConfig[chain].l2TableName}
        WHERE
              label = 'seer'
              AND label_type = 'tx_call'
              AND label_name = 'outboundTransfer'
              AND ADDRESS = DECODE('${bridgeConfig[chain].addressL1GatewayRouter}', 'hex') -- cE18836b233C83325Cc8848CA4487e94C6288264 -- Ethereum addressDeposit
        
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
              true as isCctp,
              block_timestamp
        FROM
            ${bridgeConfig[chain].l1TableName}
        WHERE
              label = 'seer'
              AND label_type = 'tx_call'
              AND label_name = 'outboundTransfer'
              AND ADDRESS = DECODE('${bridgeConfig[chain].addressL1GatewayRouter}', 'hex') -- cE18836b233C83325Cc8848CA4487e94C6288264 -- Ethereum addressDeposit
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
          true as isCctp,
          block_timestamp
        FROM
          ${bridgeConfig[chain].l1TableName}
        WHERE
          label = 'seer'
          AND label_type = 'tx_call'
          AND label_name = 'depositEth'
          AND ADDRESS = DECODE('${bridgeConfig[chain].addressL1GatewayRouter}', 'hex') -- cE18836b233C83325Cc8848CA4487e94C6288264 -- Ethereum addressDeposit
        UNION ALL
        SELECT
          'DEPOSIT' AS type,
          label_data->'args'->>'amount' as amount,
          ${bridgeConfig[chain].l2rleationship.parentNetworkChainId} AS parentNetworkChainId,
          ${bridgeConfig[chain].l2rleationship.childNetworkChainId} AS childNetworkChainId,
          transaction_hash AS parentNetworkHash,
          block_timestamp AS parentNetworkTimestamp,
          block_timestamp AS completionTimestamp,
          '0x' || ENCODE(origin_address, 'hex') AS from_address,
          '0x' || ENCODE(origin_address, 'hex') AS to_address,
          '${bridgeConfig[chain].nativeToken}' AS token,
          true AS isDeposit,
          true as isCctp,
          block_timestamp
        FROM ${bridgeConfig[chain].l1TableName}
        WHERE label_name = 'depositForBurn'
        and address = DECODE('${bridgeConfig[chain].EthereumCircleTokenMessenger}', 'hex')
        and label_data->'args'->>'destinationDomain' = '1' -- 1 is the destination domain for the arbitrum chain
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
                          'isDeposit', isDeposit,
                          'isCctp', isCctp,
                          'symbol', symbol
                  ) AS data,
                  block_timestamp,
                  from_address,
                  to_address
          FROM
                  l2_to_l3_desposits
                  left join game7_token_info on l2_to_l3_desposits.token = game7_token_info.address
          
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
                          'isDeposit', isDeposit,
                          'isCctp', isCctp,
                          'symbol', symbol
                  ) AS data,
                  block_timestamp,
                  from_address,
                  to_address
          FROM
                  l1_to_l2_deposit
                  left join arbitrum_token_info on l1_to_l2_deposit.token = arbitrum_token_info.address
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
                          'status', status,
                          'symbol', symbol
                  ) AS data,
                  block_timestamp,
                  from_address,
                  to_address
          FROM
                  l2_to_l1_withdraw
                  left join ethereum_token_info on l2_to_l1_withdraw.token = ethereum_token_info.address
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
                          'status', status,
                          'symbol', symbol
                  ) AS data,
                  block_timestamp,
                  from_address,
                  to_address
          FROM
                  withdrawal_l3_l2
                  left join arbitrum_token_info on withdrawal_l3_l2.token = arbitrum_token_info.address
    )
    SELECT
      data
    FROM
      full_history
    WHERE
      from_address = $1
      or from_address = '0x' || ENCODE(DECODE(SUBSTRING($1 FROM 3), 'hex'), 'hex')
      or to_address = $1
      or to_address = '0x' || ENCODE(DECODE(SUBSTRING($1 FROM 3), 'hex'), 'hex')
    ORDER BY
      block_timestamp DESC
      OFFSET $2
      LIMIT $3
  `;
    const result = await pool.query(query, [
      address, offset, limit]
    )
    // unpack the data from the result
    const data = result.rows.map((row: any) => row.data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw new Error(String(error));
  }
}



// // 1. Define template snippets for each operation.
// const TX_SNIPPETS = {
//   withdrawL3toL2: `
//     SELECT
//       'L3_TO_L2_WITHDRAW' AS flow,
//       transaction_hash,
//       COALESCE(label_data->'args'->>'_l1Token', '{L3_TOKEN}') AS token,
//       label_data->'args'->>'_amount' AS amount,
//       '0x' || encode(origin_address, 'hex') AS from_address,
//       block_timestamp,
//       label_data->>'status' AS status,
//       label_data->'args'->>'_to' AS to_address
//     FROM {L3_TABLE}
//     WHERE (address, label_name) IN (
//       (DECODE($1, 'hex'), 'withdrawEth'),
//       (DECODE($2, 'hex'), 'outboundTransfer')
//     )
//   `,
//   withdrawL2toL1: `
//     SELECT
//       'L2_TO_L1_WITHDRAW' AS flow,
//       transaction_hash,
//       COALESCE(label_data->'args'->>'_l1Token', '{L2_TOKEN}') AS token,
//       label_data->'args'->>'_amount' AS amount,
//       '0x' || encode(origin_address, 'hex') AS from_address,
//       block_timestamp,
//       label_data->>'status' AS status,
//       label_data->'args'->>'_to' AS to_address
//     FROM {L2_TABLE}
//     WHERE (address, label_name) IN (
//       (DECODE($3, 'hex'), 'withdrawEth'),
//       (DECODE($4, 'hex'), 'outboundTransfer')
//     )
//   `,
//   depositL1toL2: `
//     SELECT
//       'L1_TO_L2_DEPOSIT' AS flow,
//       transaction_hash,
//       label_data->'args'->>'_amount' AS amount,
//       label_data->'args'->>'_token' AS token,
//       '0x' || encode(origin_address, 'hex') AS from_address,
//       label_data->'args'->>'_to' AS to_address,
//       block_timestamp,
//       CASE WHEN label_data->>'status' = '1' THEN true ELSE false END AS isDeposit
//     FROM {L1_TABLE}
//     WHERE label_type = 'tx_call'
//       AND label_name = 'outboundTransfer'
//   `,
//   depositL2toL3: `
//     SELECT
//       'L2_TO_L3_DEPOSIT' AS flow,
//       transaction_hash,
//       label_data->'args'->>'_amount' AS amount,
//       label_data->'args'->>'_token' AS token,
//       '0x' || encode(origin_address, 'hex') AS from_address,
//       label_data->'args'->>'_to' AS to_address,
//       block_timestamp,
//       CASE WHEN label_data->>'status' = '1' THEN true ELSE false END AS isDeposit
//     FROM {L2_TABLE}
//     WHERE label_type = 'tx_call'
//       AND label_name = 'depositERC20'
//   `,
//   claimEvent: `
//     SELECT
//       'CLAIM' AS flow,
//       transaction_hash,
//       block_timestamp,
//       label_data->'args'->>'transactionIndex' AS position,
//       '0x' || encode(origin_address, 'hex') AS from_address
//     FROM {L1_TABLE}
//     WHERE label_name = 'OutBoxTransactionExecuted'
//       AND address = DECODE($5, 'hex')
//   `
// };

// // 2. Construct a function to build a unified query using these snippets.
// function buildFullFlowQuery(config: any) {
//   // Insert chain-specific values:
//   // e.g., config.l3TableName, config.l2TableName, config.l1TableName,
//   // config.l3Token, config.l2Token, etc.
//   const withdrawL3toL2SQL = TX_SNIPPETS.withdrawL3toL2
//     .replace('{L3_TABLE}', config.l3TableName)
//     .replace('{L3_TOKEN}', config.l3Token);

//   const withdrawL2toL1SQL = TX_SNIPPETS.withdrawL2toL1
//     .replace('{L2_TABLE}', config.l2TableName)
//     .replace('{L2_TOKEN}', config.l2Token);

//   const depositL1toL2SQL = TX_SNIPPETS.depositL1toL2
//     .replace('{L1_TABLE}', config.l1TableName);

//   const depositL2toL3SQL = TX_SNIPPETS.depositL2toL3
//     .replace('{L2_TABLE}', config.l2TableName);

//   const claimEventSQL = TX_SNIPPETS.claimEvent
//     .replace('{L1_TABLE}', config.l1TableName);

//   // 3. Combine them via WITH + UNION ALL in a final query.
//   //    Each snippet can be given a CTE name, then we unify them in cte_all.
//   const finalQuery = `
//     WITH cte_withdrawL3toL2 AS (
//       ${withdrawL3toL2SQL}
//     ),
//     cte_withdrawL2toL1 AS (
//       ${withdrawL2toL1SQL}
//     ),
//     cte_depositL1toL2 AS (
//       ${depositL1toL2SQL}
//     ),
//     cte_depositL2toL3 AS (
//       ${depositL2toL3SQL}
//     ),
//     cte_claimEvent AS (
//       ${claimEventSQL}
//     ),
//     cte_all AS (
//       SELECT * FROM cte_withdrawL3toL2
//       UNION ALL
//       SELECT * FROM cte_withdrawL2toL1
//       UNION ALL
//       SELECT * FROM cte_depositL1toL2
//       UNION ALL
//       SELECT * FROM cte_depositL2toL3
//       UNION ALL
//       SELECT * FROM cte_claimEvent
//     )
//     SELECT *
//     FROM cte_all
//     WHERE from_address = $6
//        OR to_address = $6
//     ORDER BY block_timestamp DESC
//     OFFSET $7
//     LIMIT $8
//   `;

//   return finalQuery;
// }



// withdraw_arbitrum_calls = `
//   SELECT
//       transaction_hash,
//       COALESCE(label_data -> 'args' ->> '_l1Token', '${bridgeConfig[chain].l3Token}') AS token,
//       '0x' || encode(origin_address, 'hex') AS origin_address,
//       label_data -> 'args' ->> '_amount' AS amount,
//       block_timestamp,
//       label_data ->> 'status' AS status
//   FROM
//       {bridgeConfig[chain].l3TableName} AS labels
//   WHERE
//       (address, label_name) IN (
//           (DECODE($1, 'hex'), 'withdrawEth'),
//           (DECODE($11, 'hex'), 'outboundTransfer')
//       )

// `
// withdraw_arbitrum_events = `
//   SELECT
//       transaction_hash,
//       label_data -> 'args' ->> 'position' AS position,
//       label_data -> 'args' ->> 'callvalue' AS amount,
//       label_data -> 'args' ->> 'destination' AS to_address
//   FROM
//       {bridgeConfig[chain].l3TableName}
//   WHERE
//       address = DECODE($1, 'hex')
//       AND label_name = 'L2ToL1Tx'
// `

// withdraw_arbitrum_claims = `
//   SELECT
//       'CLAIM' AS type,
//       transaction_hash,
//       label_data->'args'->>'transactionIndex' AS position,
//       label_data->'args'->>'l2Sender' AS from_address,    
//       label_data->'args'->>'to' AS to_address,
//       '${bridgeConfig[chain].l3Token}' AS token,
//       label_data->'args'->>'value' AS amount,
//       'from_l3_to_l2 claim' AS type,
//       block_number,
//       block_timestamp,
//       true AS status
//   FROM ${bridgeConfig[chain].l2TableName}
//   WHERE
//       label = 'seer' AND
//       label_type = 'event' AND
//       label_name = 'OutBoxTransactionExecuted' AND
//       address = DECODE($2, 'hex') -- '64105c6C3D494469D5F21323F0E917563489d9f5' -- Arbitrum outbox address
// `
// withdraw_arbitrum_withdrawal = `
//   SELECT
//     'WITHDRAWAL' AS type,
//     we.position AS position,
//     coalesce(wc.amount, we.amount) AS amount,
//     ${bridgeConfig[chain].l3rleationship.parentNetworkChainId} AS parentNetworkChainId,
//     ${bridgeConfig[chain].l3rleationship.childNetworkChainId} AS childNetworkChainId,
//     wc.transaction_hash AS childNetworkHash,
//     wc.block_timestamp AS childNetworkTimestamp,
//     wc.origin_address AS from_address,
//     we.to_address AS to_address,
//     3600 AS challengePeriod,
//     (wc.block_timestamp + 3600) AS claimableTimestamp,
//     wc.block_timestamp AS block_timestamp,
//     wc.token AS token,
//     wc.status AS status
//   FROM
//     (withdraw_arbitrum_calls) wc
//     LEFT JOIN (withdraw_arbitrum_events) we ON we.transaction_hash = wc.transaction_hash
// `

// withdraw_arbitrum = `
//   select 
//     wc.type,
//     wc.transaction_hash,
//     wc.token,
//     wc.amount,
//     wc.from_address,
//     wc.to_address,
//     wc.status
//     wc.block_timestamp,
//     wc.parentNetworkChainId,
//     wc.childNetworkChainId,
//     wc.childNetworkHash,
//     wc.childNetworkTimestamp,
//     wc.challengePeriod,
//     wc.claimableTimestamp,
//     we.block_timestamp as completionTimestamp,
//     we.block_timestamp as parentNetworkTimestamp,
//     we.transaction_hash as parentNetworkHash,
//     wc.status,
//     wc.block_timestamp as block_timestamp
//    from (withdraw_arbitrum_withdrawal) wc
//   left join (withdraw_arbitrum_claims) we on we.position = wc.position
// `


// withdrawl_arbitrum =
//   `WITH game7_withdrawal_calls AS (
//   SELECT
//       transaction_hash,
//       COALESCE(label_data -> 'args' ->> '_l1Token', '${bridgeConfig[chain].l3Token}') AS token,
//       '0x' || encode(origin_address, 'hex') AS origin_address,
//       label_data -> 'args' ->> '_amount' AS amount,
//       block_timestamp,
//       label_data ->> 'status' AS status
//   FROM
//       ${bridgeConfig[chain].l3TableName} AS labels
//   WHERE
//       (address, label_name) IN (
//           (DECODE($1, 'hex'), 'withdrawEth'),
//           (DECODE($11, 'hex'), 'outboundTransfer')
//       )
// ), game7_withdrawal_events AS (
//   SELECT
//       transaction_hash,
//       label_data -> 'args' ->> 'position' AS position,
//       label_data -> 'args' ->> 'callvalue' AS amount,
//       label_data -> 'args' ->> 'destination' AS to_address
//   FROM
//       ${bridgeConfig[chain].l3TableName}
//   WHERE
//       address = DECODE($1, 'hex')
//       AND label_name = 'L2ToL1Tx'
// ), game7_withdrawal AS (
// SELECT
//     'WITHDRAWAL' AS type,
//     we.position AS position,
//     coalesce(wc.amount, we.amount) AS amount,
//     ${bridgeConfig[chain].l3rleationship.parentNetworkChainId} AS parentNetworkChainId,
//     ${bridgeConfig[chain].l3rleationship.childNetworkChainId} AS childNetworkChainId,
//     wc.transaction_hash AS childNetworkHash,
//     wc.block_timestamp AS childNetworkTimestamp,
//     wc.origin_address AS from_address,
//     we.to_address AS to_address,
//     3600 AS challengePeriod,
//     (wc.block_timestamp + 3600) AS claimableTimestamp,
//     wc.block_timestamp AS block_timestamp,
//     wc.token AS token,
//     wc.status AS status
// FROM
//     game7_withdrawal_calls wc
//     LEFT JOIN game7_withdrawal_events we ON we.transaction_hash = wc.transaction_hash
// ),arbirtrum_claims as (
// SELECT
//     'CLAIM' AS type,
//     transaction_hash,
//     label_data->'args'->>'transactionIndex' AS position,
//     label_data->'args'->>'l2Sender' AS from_address,    
//     label_data->'args'->>'to' AS to_address,
//     '${bridgeConfig[chain].l3Token}' AS token,
//     label_data->'args'->>'value' AS amount,
//     'from_l3_to_l2 claim' AS type,
//     block_number,
//     block_timestamp,
//     true AS status
// FROM ${bridgeConfig[chain].l2TableName}
// WHERE
//     label = 'seer' AND
//     label_type = 'event' AND
//     label_name = 'OutBoxTransactionExecuted' AND
//     address = DECODE($2, 'hex') -- '64105c6C3D494469D5F21323F0E917563489d9f5' -- Arbitrum outbox address
// ), withdrawal_l3_l2 as (
// SELECT
//     'WITHDRAWAL' AS type,
//     game7_withdrawal.position AS position,
//     game7_withdrawal.amount AS amount,
//     game7_withdrawal.parentNetworkChainId AS parentNetworkChainId,
//     game7_withdrawal.childNetworkChainId AS childNetworkChainId,
//     game7_withdrawal.childNetworkHash AS childNetworkHash,
//     game7_withdrawal.childNetworkTimestamp AS childNetworkTimestamp,
//     game7_withdrawal.from_address AS from_address,
//     game7_withdrawal.to_address AS to_address,
//     game7_withdrawal.challengePeriod AS challengePeriod,
//     game7_withdrawal.claimableTimestamp AS claimableTimestamp,
//     game7_withdrawal.token as token,
//     arbirtrum_claims.block_timestamp AS completionTimestamp,
//     arbirtrum_claims.block_timestamp AS parentNetworkTimestamp,
//     arbirtrum_claims.transaction_hash AS parentNetworkHash,
//     true AS status,
//     game7_withdrawal.block_timestamp AS block_timestamp
// FROM
//     game7_withdrawal
//     LEFT JOIN arbirtrum_claims ON game7_withdrawal.position = arbirtrum_claims.position`