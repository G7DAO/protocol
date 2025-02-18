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
    WITH domains(domain, name) AS (
        VALUES ('0', 'Ethereum'),
              ('1', 'Avalanche'),
              ('2', 'OP (Optimism)'),
              ('3', 'Arbitrum'),
              ('4', 'Noble'),
              ('5', 'Solana'),
              ('6', 'Base'),
              ('7', 'Polygon PoS'),
              ('8', 'Sui'),
              ('9', 'Aptos')
    ),
    game7_token_info as (
      SELECT DISTINCT '0x' || ENCODE(address, 'hex') as address,
      label_data->'result'->>0 AS symbol
      FROM ${bridgeConfig[chain].l3TableName}
      WHERE label_name = 'symbol'
      UNION ALL
      SELECT * FROM (
        VALUES ('${bridgeConfig[chain].nativeToken}', '${bridgeConfig[chain].G7nativeTokenName}')
      ) as t(address, symbol)
    ),
    arbitrum_token_info as (
      SELECT DISTINCT '0x' || ENCODE(address, 'hex') as address,
      label_data->'result'->>0 AS symbol
      FROM ${bridgeConfig[chain].l2TableName}
      WHERE label_name = 'symbol'
      UNION ALL
      SELECT * FROM (
        VALUES ('${bridgeConfig[chain].l2Token}', '${bridgeConfig[chain].l2TokenName}'),
        ('${bridgeConfig[chain].nativeToken}', 'ETH') 
      ) as t(address, symbol)
    ),
    ethereum_token_info as (
      SELECT DISTINCT '0x' || ENCODE(address, 'hex') as address,
      label_data->'result'->>0 AS symbol
      FROM ${bridgeConfig[chain].l1TableName}
      WHERE 
      label = 'view-state-alpha'
      AND label_name = 'symbol'
      UNION ALL
      SELECT * FROM (
        VALUES ('${bridgeConfig[chain].l1Token}', '${bridgeConfig[chain].l1TokenName}'),
        ('${bridgeConfig[chain].nativeToken}', 'ETH')
      ) as t(address, symbol)
    ),
    game7_l1_to_l2_tokens(l1_token, l2_token) as (
      select
          label_data -> 'inputs' ->> 0 as l1_token,
          label_data -> 'result' ->> 0 as l2_token
      from
          ${bridgeConfig[chain].l3TableName}
      where
          label = 'view-state-alpha'
          AND address = DECODE('${bridgeConfig[chain].addressL3GatewayRouter}', 'hex')
          AND label_name = 'calculateL2TokenAddress'
    ),
    arbitrum_l1_to_l2_tokens(l1_token, l2_token) as (
      select
          label_data -> 'inputs' ->> 0 as l1_token,
          label_data -> 'result' ->> 0 as l2_token
      from
          ${bridgeConfig[chain].l2TableName}
      where
          label = 'view-state-alpha'
          AND address = DECODE('${bridgeConfig[chain].addressL2GatewayRouter}', 'hex')
          AND label_name = 'calculateL2TokenAddress'
    ),
    game7_withdrawal_calls AS (
        SELECT
            transaction_hash,
            COALESCE(l2_token, '${bridgeConfig[chain].nativeToken}') as token,
            COALESCE(l2_token, '${bridgeConfig[chain].nativeToken}') as origin_token,
            COALESCE(l1_token, '${bridgeConfig[chain].l2Token}') as destination_token,
            '0x' || encode(origin_address, 'hex') AS from_address,
            label_data -> 'args' ->> '_amount' AS amount,
            block_timestamp,
            label_data ->> 'status' AS status
        FROM
            ${bridgeConfig[chain].l3TableName} AS labels
            left join game7_l1_to_l2_tokens on labels.label_data->'args'->>'_l1Token' = game7_l1_to_l2_tokens.l1_token
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
            address = DECODE('${bridgeConfig[chain].addressArbOS}', 'hex')
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
          ${bridgeConfig[chain].ClaimableTimeCanonicalArbitrum} AS challengePeriod,
          (wc.block_timestamp + ${bridgeConfig[chain].ClaimableTimeCanonicalArbitrum}) AS claimableTimestamp,
          wc.block_timestamp AS block_timestamp,
          wc.token AS token,
          wc.origin_token AS origin_token,
          wc.destination_token AS destination_token,
          wc.status AS status
      FROM
          game7_withdrawal_calls wc
          LEFT JOIN game7_withdrawal_events we ON we.transaction_hash = wc.transaction_hash
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
          address = DECODE('${bridgeConfig[chain].addressArbitrumOutBox}', 'hex') AND
          label_name = 'OutBoxTransactionExecuted'
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
          game7_withdrawal.origin_token AS origin_token,
          game7_withdrawal.destination_token AS destination_token,
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
            DISTINCT transaction_hash,
            COALESCE(l2_token, '${bridgeConfig[chain].nativeToken}') as token,
            COALESCE(l2_token, '${bridgeConfig[chain].nativeToken}') as origin_token,
            COALESCE(l1_token, '${bridgeConfig[chain].l2Token}') as destination_token,
            '0x' || encode(origin_address, 'hex') AS from_address,
            label_data -> 'args' ->> '_amount' AS amount,
            block_timestamp,
            label_data ->> 'status' AS status
        FROM
            ${bridgeConfig[chain].l2TableName} AS labels
            left join arbitrum_l1_to_l2_tokens on labels.label_data->'args'->>'_l1Token' = arbitrum_l1_to_l2_tokens.l1_token
            WHERE
                label = 'seer'
                AND (
                    (label_name = 'outboundTransfer' 
                    AND label_type = 'tx_call'
                    AND address = DECODE('${bridgeConfig[chain].addressL2GatewayRouter}', 'hex'))
                    OR 
                    (label_name = 'withdrawEth'
                    AND address = DECODE('${bridgeConfig[chain].addressArbOS}', 'hex'))
                )
    ),
    withdrawal_events_arbitrum  AS (
        SELECT DISTINCT
            transaction_hash,
            label_data -> 'args' ->> 'position' AS position,
            label_data -> 'args' ->> 'callvalue' AS amount,
            label_data -> 'args' ->> 'destination' AS to_address
        FROM
            ${bridgeConfig[chain].l2TableName}
        WHERE
            label='seer'
            AND address = DECODE('${bridgeConfig[chain].addressArbOS}', 'hex')
            AND label_name = 'L2ToL1Tx'
    ),
    arbitrum_circle_withdrawal_events as (
      SELECT
        transaction_hash,
        label_data -> 'args' ->> 'message' AS message
      FROM
        ${bridgeConfig[chain].l2TableName}
      WHERE
        label='seer'
        AND address = DECODE('${bridgeConfig[chain].arbitrumCircleTransmitter}', 'hex')
        AND label_name = 'MessageSent'
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
            ${bridgeConfig[chain].ClaimableTimeCanonicalArbitrum} AS challengePeriod,
            (wc.block_timestamp + ${bridgeConfig[chain].ClaimableTimeCanonicalArbitrum}) AS claimableTimestamp,
            wc.block_timestamp AS block_timestamp,
            wc.token AS token,
            wc.origin_token AS origin_token,
            wc.destination_token AS destination_token,
            wc.status AS status,
            false as isCctp
        FROM
            withdrawal_calls_arbitrum  wc
            LEFT JOIN withdrawal_events_arbitrum we ON we.transaction_hash = wc.transaction_hash
          UNION ALL
        select 
          'WITHDRAWAL' as type,
          message as position,
          label_data->'args'->>'amount' as amount,
          ${bridgeConfig[chain].l2rleationship.parentNetworkChainId} AS parentNetworkChainId,
          ${bridgeConfig[chain].l2rleationship.childNetworkChainId} AS childNetworkChainId,
          labels.transaction_hash AS childNetworkHash,
          block_timestamp AS childNetworkTimestamp,
          '0x' || ENCODE(origin_address, 'hex') as to_address,
          '0x' || ENCODE(origin_address, 'hex') AS from_address,
          ${bridgeConfig[chain].ClaimableTimeCCTP} AS challengePeriod,
          (block_timestamp + ${bridgeConfig[chain].ClaimableTimeCCTP}) AS claimableTimestamp,
          block_timestamp as block_timestamp,
          label_data->'args'->>'burnToken' as token,
          label_data->'args'->>'burnToken' as origin_token,
          NULL as destination_token,
          label_data->>'status' as status,
          true as isCctp
        from ${bridgeConfig[chain].l2TableName} as labels
        LEFT JOIN arbitrum_circle_withdrawal_events ON arbitrum_circle_withdrawal_events.transaction_hash = labels.transaction_hash
        where 
          label='seer'
          AND address = DECODE('${bridgeConfig[chain].AtbitrumCircleTokenMessenger}', 'hex') -- '0x00D2d23DEA90243D4f73cf088ea5666690299465' -- Arbitrum CircleTokenMessenger
          AND label_name = 'depositForBurn'
          and label_data->'args'->>'destinationDomain' = (
            select domain from domains where name = 'Ethereum'
          )
    ), ethereum_claims AS (
        SELECT
            -- 'CLAIM' AS type,
            label_data -> 'args' ->> 'transactionIndex' AS position,
            transaction_hash,
            block_timestamp
        FROM
            ${bridgeConfig[chain].l1TableName}
        WHERE
            address = DECODE('${bridgeConfig[chain].addressEthereumOutbox}', 'hex')
            AND label_name = 'OutBoxTransactionExecuted'
        UNION ALL
        SELECT
            -- 'CLAIM' AS type,
            label_data -> 'args' ->> 'message' AS position,
            transaction_hash,
            block_timestamp
        FROM
            ${bridgeConfig[chain].l1TableName}
        WHERE
            address = DECODE('${bridgeConfig[chain].ethereumCircleTransmitter}', 'hex')
            AND label_name = 'receiveMessage'
            AND label_data->>'status' = '1'
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
            aw.origin_token AS origin_token,
            aw.destination_token AS destination_token,
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
              '${bridgeConfig[chain].l3Token}' as origin_token,
              NULL as destination_token,
              CASE
                    WHEN label_data ->> 'status' = '1' THEN true
                    ELSE false
              END AS isDeposit,
              false as isCctp,
              block_timestamp
        FROM
              ${bridgeConfig[chain].l2TableName}
        WHERE
              label = 'seer'
              AND address = DECODE('${bridgeConfig[chain].addressERC20Inbox}', 'hex') -- e6470bb72291c39073aed67a30ff93b69c1f47de -- Arbitrum addressERC20Inbox
              AND label_name = 'depositERC20'
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
              '${bridgeConfig[chain].l3Token}' as origin_token,
              NULL as destination_token,
              CASE
                    WHEN label_data ->> 'status' = '1' THEN true
                    ELSE false
              END AS isDeposit,
              false as isCctp,
              block_timestamp
        FROM
            ${bridgeConfig[chain].l2TableName}
        WHERE
              label = 'seer'
              AND address = DECODE('${bridgeConfig[chain].addressL1GatewayRouter}', 'hex') -- cE18836b233C83325Cc8848CA4487e94C6288264 -- Ethereum addressDeposit
              AND label_name = 'outboundTransfer'
        
    ),
    ethereum_circle_deposit_events as (
      SELECT
        transaction_hash,
        label_data -> 'args' ->> 'message' AS message
      FROM
        ${bridgeConfig[chain].l1TableName}
      WHERE
        label='seer'
        AND address = DECODE('${bridgeConfig[chain].ethereumCircleTransmitter}', 'hex')
        AND label_name = 'MessageSent'
    ),
    arbitrum_circle_claims as (
      SELECT
        'CLAIM' AS type,
        label_data -> 'args' ->> 'message' AS position,
        transaction_hash,
        block_timestamp
      FROM
        ${bridgeConfig[chain].l2TableName}
      WHERE
        label='seer'
        AND address = DECODE('${bridgeConfig[chain].arbitrumCircleTransmitter}', 'hex')
        AND label_name = 'receiveMessage'
        AND label_data->>'status' = '1'
    ),
    l1_to_l2_deposit as (
        select * from ( 
       SELECT
              'DEPOSIT' AS type,
              '' as position,
              label_data -> 'args' ->> '_amount' AS amount,
              ${bridgeConfig[chain].l2rleationship.parentNetworkChainId} AS parentNetworkChainId,
              ${bridgeConfig[chain].l2rleationship.childNetworkChainId} AS childNetworkChainId,
              transaction_hash AS parentNetworkHash,
              block_timestamp AS parentNetworkTimestamp,
              block_timestamp AS completionTimestamp,
              '0x' || ENCODE(origin_address, 'hex') AS from_address,
              label_data ->'args'->> '_to' AS to_address,
              label_data ->'args' ->> '_token' AS token,
              label_data ->'args' ->> '_token' as origin_token,
              NULL as destination_token,
              CASE
                    WHEN label_data ->> 'status' = '1' THEN true
                    ELSE false
              END AS isDeposit,
              false as isCctp,
              block_timestamp
        FROM
            ${bridgeConfig[chain].l1TableName}
        WHERE
              label = 'seer'
              AND address = DECODE('${bridgeConfig[chain].addressL1GatewayRouter}', 'hex') -- cE18836b233C83325Cc8848CA4487e94C6288264 -- Ethereum addressDeposit
              AND label_name = 'outboundTransfer'
        UNION ALL
        SELECT
          'DEPOSIT' AS type,
          '' as position,
          NULL AS amount,
          ${bridgeConfig[chain].l2rleationship.parentNetworkChainId} AS parentNetworkChainId,
          ${bridgeConfig[chain].l2rleationship.childNetworkChainId} AS childNetworkChainId,
          transaction_hash AS parentNetworkHash,
          block_timestamp AS parentNetworkTimestamp,
          block_timestamp AS completionTimestamp,
          '0x' || ENCODE(origin_address, 'hex') AS from_address,
          '0x' || ENCODE(origin_address, 'hex') AS to_address,
          '${bridgeConfig[chain].nativeToken}' AS token,
          '${bridgeConfig[chain].nativeToken}' AS origin_token,
          NULL as destination_token,
          CASE
            WHEN label_data ->> 'status' = '1' THEN true
            ELSE false
          END AS isDeposit,
          false as isCctp,
          block_timestamp
        FROM
          ${bridgeConfig[chain].l1TableName}
        WHERE
          label = 'seer'
          AND address = DECODE('${bridgeConfig[chain].addressL1GatewayRouter}', 'hex') -- cE18836b233C83325Cc8848CA4487e94C6288264 -- Ethereum addressDeposit
          AND label_name = 'depositEth'
        UNION ALL
        SELECT
          'DEPOSIT' AS type,
          message as position,
          label_data->'args'->>'amount' as amount,
          ${bridgeConfig[chain].l2rleationship.parentNetworkChainId} AS parentNetworkChainId,
          ${bridgeConfig[chain].l2rleationship.childNetworkChainId} AS childNetworkChainId,
          labels.transaction_hash AS parentNetworkHash,
          labels.block_timestamp AS parentNetworkTimestamp,
          labels.block_timestamp AS completionTimestamp,
          '0x' || ENCODE(origin_address, 'hex') AS from_address,
          '0x' || ENCODE(origin_address, 'hex') AS to_address,
          label_data->'args'->>'burnToken' as token,
          label_data->'args'->>'burnToken' as origin_token,
          NULL as destination_token,
          true AS isDeposit,
          true as isCctp,
          block_timestamp
        FROM ${bridgeConfig[chain].l1TableName} as labels
        left join ethereum_circle_deposit_events on ethereum_circle_deposit_events.transaction_hash = labels.transaction_hash
        WHERE  
        labels.label='seer'
        AND labels.address = DECODE('${bridgeConfig[chain].EthereumCircleTokenMessenger}', 'hex')
        AND labels.label_name = 'depositForBurn'
        AND label_data->'args'->>'destinationDomain' = (
          select domain from domains where name = 'Arbitrum'
        )
      ) as a
    ),
    l1_to_l2_deposit_with_claims as (
      select 
        l1_to_l2_deposit.*, 
        claims.transaction_hash as childNetworkHash, 
        claims.block_timestamp as childNetworkTimestamp
      from l1_to_l2_deposit
      left join arbitrum_circle_claims as claims on l1_to_l2_deposit.position = claims.position
    ),  
    full_history as (
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
                          'origin_token', origin_token,
                          'destination_token', destination_token,
                          'isDeposit', isDeposit,
                          'isCctp', isCctp,
                          'symbol', symbol
                  ) AS data,
                  block_timestamp,
                  from_address,
                  to_address
          FROM
                  l2_to_l3_desposits
                  left join arbitrum_token_info on l2_to_l3_desposits.token = arbitrum_token_info.address
          
          UNION ALL
          SELECT
                  json_build_object(
                          'type', type,
                          'amount', amount,
                          'position', position,
                          'parentNetworkChainId', parentNetworkChainId,
                          'childNetworkChainId', childNetworkChainId,
                          'parentNetworkHash', parentNetworkHash,
                          'childNetworkHash', childNetworkHash,
                          'parentNetworkTimestamp', parentNetworkTimestamp,
                          'childNetworkTimestamp', childNetworkTimestamp,
                          'completionTimestamp', completionTimestamp,
                          'from_address', from_address,
                          'to_address', to_address,
                          'token', token,
                          'origin_token', origin_token,
                          'destination_token', destination_token,
                          'isDeposit', isDeposit,
                          'isCctp', isCctp,
                          'symbol', symbol
                  ) AS data,
                  block_timestamp,
                  from_address,
                  to_address
          FROM
                  l1_to_l2_deposit_with_claims
                  left join ethereum_token_info on l1_to_l2_deposit_with_claims.token = ethereum_token_info.address
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
                          'origin_token', origin_token,
                          'destination_token', destination_token,
                          'status', status,
                          'symbol', symbol,
                          'isCctp', isCctp
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
                          'origin_token', origin_token,
                          'destination_token', destination_token,
                          'status', status,
                          'symbol', symbol,
                          'isCctp', false
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