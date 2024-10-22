// src/services/pool.service.ts
import { pool } from '../utils/db'; // Adjust the import path as necessary

export async function getAllPoolPositions(poolId: string): Promise<object | string> {
    const tableName = 'game7_testnet_labels'; // Adjust the table name as necessary
    const addressHex = 'a6B0461b7E54Fa342Be6320D4938295A81f82Cd3'; // Adjust the address as necessary

    try {
        const query = `        
        with pool_event as (
        select
            transaction_hash,
            label_data->'args'->>'poolID' as pool_id,
            label_data->'args'->>'tokenID' as token_id,
            label_data->'args'->>'tokenType' as token_type,
            label_data->'args'->>'tokenAddress' as token_address,
            '0x' || encode(origin_address,'hex') as origin_address
        from ${tableName}
        where address = DECODE($1, 'hex')
        and label_name = 'StakingPoolCreated'
        ),
        pool_tx as (
        select
            transaction_hash,
            label_data->'args'->>'transferable' as transferable,
            label_data->'args'->>'lockupSeconds' as lockup_seconds,
            label_data->'args'->>'cooldownSeconds' as cooldown_seconds
        from ${tableName}
        where address = DECODE($2, 'hex')
        and label_name = 'createPool'
        ),
        pool_full_info as (
        select
            pe.pool_id,
            pe.token_id,
            pe.token_type,
            pe.token_address,
            pe.origin_address,
            pt.transferable,
            pt.lockup_seconds,
            pt.cooldown_seconds
        from pool_event pe
        left join pool_tx pt on pe.transaction_hash = pt.transaction_hash
        ),
        staking as (	
            select
            to_timestamp(block_timestamp) as time,
            label_data->'args'->>'owner' as address,
            cast((label_data->'args'->>'amountOrTokenID') as float) * 1 as amount,
            label_data->'args'->>'poolID' as pool_id,
            label_data->'args'->>'positionTokenID' as position_token_id,
            'stake' as label
            from ${tableName}
            where address = DECODE($3, 'hex')
            and label_name = 'Staked'

            union all	

            select
            to_timestamp(block_timestamp) as time,
            label_data->'args'->>'owner' as address,
            cast((label_data->'args'->>'amountOrTokenID') as float) * -1 as amount,
            label_data->'args'->>'poolID' as pool_id,
            label_data->'args'->>'positionTokenID' as position_token_id,
            'unstake' as label
            from ${tableName}
            where address = DECODE($4, 'hex')
            and label_name = 'Unstaked' 
            
            union all
            
            SELECT
                to_timestamp(block_timestamp) AS time,
                NULL AS address,  -- Set these fields to NULL to prevent blank values
                NULL AS amount,
                NULL AS pool_id,
                label_data->'args'->>'positionTokenID' AS position_token_id,
                'unstaking' AS label
            FROM ${tableName}
            WHERE address = DECODE($5, 'hex')
            AND label_name = 'initiateUnstake' 
        ),
        nft_tokenids as (
            select
            label_data->'args'->>'tokenId' as tokenid,
            label_data->'args'->>'to' as to_add,
            to_timestamp(block_timestamp) as time
            from ${tableName}
            where address = DECODE($6, 'hex')
            and label_name = 'Transfer'
        ),
        nft_token_latest as (
            select
            label_data->'args'->>'tokenId' as tokenid,
            max(to_timestamp(block_timestamp)) as latest_time
            from ${tableName}
            where address = DECODE($7, 'hex')
            and label_name = 'Transfer'
            group by 1
        ),
        nft_holders as (
        select
            t.tokenid as position_id,
            t.to_add as owner_address
        from nft_token_latest l
        left join nft_tokenids t
        on l.tokenid = t.tokenid and t.time = l.latest_time
        order by t.tokenid
        ),
        position_states AS (
            SELECT
                COALESCE(MAX(pool_id), '') AS pool_id,  
                position_token_id,
                COALESCE(MAX(address), '') AS address,  
                COALESCE(MAX(amount), 0) AS amount,    
                MAX(CASE WHEN label = 'stake' THEN time END) AS staked_time, 
                CASE
                    WHEN SUM(CASE WHEN label = 'unstake' THEN 1 ELSE 0 END) > 0 THEN 'unstaked'
                    WHEN SUM(CASE WHEN label = 'unstaking' THEN 1 ELSE 0 END) > 0 THEN 'unstaking' 
                    ELSE 'staked'
                END AS state
            FROM staking
            WHERE position_token_id IS NOT NULL  -- Filter out rows where position_token_id is null
            GROUP BY position_token_id
        ),
        final_positions AS (
            SELECT
                ps.pool_id,
                ps.position_token_id,
                ps.staked_time, 
                ps.amount / 1e18 AS amount,
                pfi.lockup_seconds,
                nh.owner_address AS owner,
                pfi.token_address AS token,
                ps.state
            FROM position_states ps
            LEFT JOIN pool_full_info pfi ON ps.pool_id = pfi.pool_id
            LEFT JOIN nft_holders nh ON ps.position_token_id = nh.position_id
        )
        SELECT * 
        FROM final_positions
        where pool_id = $8
        ORDER BY pool_id ASC;
        `;
        const result = await pool.query(query, [addressHex, addressHex, addressHex, addressHex, addressHex, addressHex, addressHex, poolId]);
        return result.rows;
    } catch (error) {
        console.error("Error:", error);
        throw new Error(String(error));
    }
}

export async function getPoolDetails(poolId: string): Promise<object | string> {
    const tableName = 'game7_testnet_labels'; // Adjust the table name as necessary
    const addressHex = 'a6B0461b7E54Fa342Be6320D4938295A81f82Cd3'; // Adjust the address as necessary
    try {
        const query = `
        with pool_event as (
        select
            transaction_hash,
            label_data->'args'->>'poolID' as pool_id,
            label_data->'args'->>'tokenID' as token_id,
            label_data->'args'->>'tokenType' as token_type,
            label_data->'args'->>'tokenAddress' as token_address,
            '0x' || encode(origin_address,'hex') as origin_address
        from ${tableName}
        where address = DECODE($1, 'hex')
        and label_name = 'StakingPoolCreated'
        ),
        pool_tx as (
        select
            transaction_hash,
            label_data->'args'->>'transferable' as transferable,
            label_data->'args'->>'lockupSeconds' as lockup_seconds,
            label_data->'args'->>'cooldownSeconds' as cooldown_seconds
        from ${tableName}
        where address = DECODE($2, 'hex')
        and label_name = 'createPool'
        ),
        pool_full_info as (
        select
            pe.pool_id,
            pe.token_id,
            pe.token_type,
            pe.token_address,
            pe.origin_address,
            pt.transferable,
            pt.lockup_seconds,
            pt.cooldown_seconds
        from pool_event pe
        left join pool_tx pt on pe.transaction_hash = pt.transaction_hash
        )
        select * 
        from pool_full_info
        where pool_id = $3;
        `;
        const result = await pool.query(query, [addressHex, addressHex, poolId]);
        return result.rows;
    } catch (error) {
        console.error("Error:", error);
        throw new Error(String(error));
    }
}