import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/dbname';


const pool = new Pool({
    connectionString: connectionString,
    statement_timeout: 5000,          // 5 seconds timeout for each query
    connectionTimeoutMillis: 3000,    // 3 seconds timeout for establishing a connection
    max: 20,                          // Maximum number of connections
    idleTimeoutMillis: 4000,          // 1 second timeout before closing an idle connection
    ssl: {
        rejectUnauthorized: false
    }
});


function playerFilter(data: any[], nftAddress: string, nftTokenId: string): object {
    const nftConcat = nftAddress + "_" + nftTokenId;
    const playerStats = data.find((stats: any) => {
        return stats.address == nftConcat;
    });
    return playerStats || {};
}

export async function getTransactionHistory(address: string): Promise<object | string> {
    try {
        const query = `

        select * from (
            select transaction_hash, '0x' || ENCODE(origin_address, 'hex') as from_address, '0x' || ENCODE(origin_address, 'hex') as to_address, '' as token, label_data->'args'->>'amount' as amount, 'from_l2_to_l3 deposit' as type, block_number from arbitrum_sepolia_labels where label='seer' and address=DECODE('e6470bb72291c39073aed67a30ff93b69c1f47de', 'hex')  and label_name = 'depositERC20'
            UNION ALL
            select transaction_hash, label_data->'args'->>'caller' as from_address, label_data->'args'->>'destination' as to_address, '' as token, label_data->'args'->>'callvalue' as amount, 'from_l3_to_l2 withdraw' as type, block_number from game7_testnet_labels where label='seer' and address=DECODE('0000000000000000000000000000000000000064', 'hex')  and label_name = 'L2ToL1Tx'
            UNION ALL
            select transaction_hash, label_data->'args'->>'l2Sender' as from_address, label_data->'args'->>'to' as to_address, '' as token, label_data->'args'->>'value' as amount, 'from_l3_to_l2 claim' as type, block_number from arbitrum_sepolia_labels where label='seer' and label_name = 'executeTransaction'
            UNION ALL
            select transaction_hash, label_data->'args'->>'_from' as from_address, label_data->'args'->>'_to' as to_address, label_data->'args'->>'l1Token' as token, label_data->'args'->>'_amount' as amount, 'from_l1_to_l2 deposit' as type, block_number from sepolia_labels where label='seer' and label_name = 'DepositInitiated'
            UNION ALL
            select transaction_hash, label_data->'args'->>'_from' as from_address, label_data->'args'->>'_to' as to_address, label_data->'args'->>'l1Token' as token, label_data->'args'->>'_amount' as amount, 'from_l2_to_l1 withdraw' as type, block_number from arbitrum_sepolia_labels where label='seer' and label_name = 'WithdrawalInitiated'
            UNION ALL
            select transaction_hash, label_data->'args'->>'_from' as from_address, label_data->'args'->>'_to' as to_address, label_data->'args'->>'l1Token' as token, label_data->'args'->>'_amount' as amount, 'from_l2_to_l1 claim' as type, block_number from sepolia_labels where label='seer' and label_name = 'WithdrawalFinalized'
            ) as t
            WHERE t.from_address = $1 OR t.to_address = $1 ORDER BY block_number DESC
        `;
        console.log("run query", query);
        const result = await pool.query(query, [address]);
        console.log("result", result);
        return result.rows;
    } catch (error) {
        console.log("error", error);
        return String(error);
    }
}

 export async function getPoolDetails(poolId: string): Promise<object | string> {
    try {
        const query = `

        with pool_ids as (
            select
                label_data->'args'->>'poolID' as pool_id,
                label_data->'args'->>'tokenID' as token_id,
                label_data->'args'->>'tokenType' as token_type,
                label_data->'args'->>'tokenAddress' as token_address,
                '0x' || encode(origin_address,'hex') as origin_address
            from game7_testnet_labels
            where address = e'\\xa6B0461b7E54Fa342Be6320D4938295A81f82Cd3'
            and label_name = 'StakingPoolCreated'
        ),
        staking as (	
            select
                to_timestamp(block_timestamp) as time,
                label_data->'args'->>'owner' as address_s,
                cast((label_data->'args'->>'amountOrTokenID') as float) * 1 as amount_s,
                label_data->'args'->>'poolID' as pool_id,
                label_data->'args'->>'positionTokenID' as position_token_id,
                'stake' as label
            from game7_testnet_labels
            where address = e'\\xa6B0461b7E54Fa342Be6320D4938295A81f82Cd3'
            and label_name = 'Staked'

            union all	
                
            select
                to_timestamp(block_timestamp) as time,
                label_data->'args'->>'owner' as address_s,
                cast((label_data->'args'->>'amountOrTokenID') as float) * -1 as amount_s,
                label_data->'args'->>'poolID' as pool_id,
                label_data->'args'->>'positionTokenID' as position_token_id,
                'unstake' as label
            from game7_testnet_labels
            where address = e'\\xa6B0461b7E54Fa342Be6320D4938295A81f82Cd3'
            and label_name = 'Unstaked' 
        ),
        active_positions AS (
            SELECT
                pool_id,
                position_token_id,
                address_s
            FROM staking
            GROUP BY pool_id, position_token_id, address_s
            HAVING SUM(CASE WHEN label = 'stake' THEN 1 ELSE -1 END) > 0  
        ),
        token_balance AS (
            SELECT
                pool_id,
                COALESCE(SUM(amount_s), 0) / 1e18 AS token_balance
            FROM staking
            GROUP BY pool_id
        ),
        pool_stats AS (
            SELECT
                pool_id,
                COUNT(DISTINCT position_token_id) AS number_of_open_positions, 
                COUNT(DISTINCT address_s) AS unique_addresses_staking     
            FROM active_positions
            GROUP BY pool_id
        )
        SELECT
            p.pool_id as pool_id,
            coalesce(tb.token_balance,0) as tokens_staked,
            coalesce(ps.number_of_open_positions,0) as total_num_positions,
            coalesce(ps.unique_addresses_staking,0) as total_num_stakers,
            case
                when coalesce(ps.unique_addresses_staking,0) = 0 then 0
                else tb.token_balance / coalesce(ps.unique_addresses_staking,0) 
                end as staked_tokens_per_user,
            p.token_type,
            p.token_address,
            p.origin_address as admin
        FROM pool_ids p
        LEFT JOIN token_balance tb ON p.pool_id = tb.pool_id
        LEFT JOIN pool_stats ps ON p.pool_id = ps.pool_id
        where p.pool_id = $1
        `;
        console.log("run query", query);
        const result = await pool.query(query, [poolId]);
        console.log("result", result);
        return result.rows;
    } catch (error) {
        console.log("error", error);
        return String(error);
    }
}

export async function getAllPoolPositions(poolId: string): Promise<object | string> {
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
        from game7_testnet_labels
        where address = e'\\xa6B0461b7E54Fa342Be6320D4938295A81f82Cd3'
        and label_name = 'StakingPoolCreated'
        ),
        pool_tx as (
        select
            transaction_hash,
            label_data->'args'->>'transferable' as transferable,
            label_data->'args'->>'lockupSeconds' as lockup_seconds,
            label_data->'args'->>'cooldownSeconds' as cooldown_seconds
        from game7_testnet_labels
        where address = e'\\xa6B0461b7E54Fa342Be6320D4938295A81f82Cd3'
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
            from game7_testnet_labels
            where address = e'\\xa6B0461b7E54Fa342Be6320D4938295A81f82Cd3'
            and label_name = 'Staked'

            union all	

            select
            to_timestamp(block_timestamp) as time,
            label_data->'args'->>'owner' as address,
            cast((label_data->'args'->>'amountOrTokenID') as float) * -1 as amount,
            label_data->'args'->>'poolID' as pool_id,
            label_data->'args'->>'positionTokenID' as position_token_id,
            'unstake' as label
            from game7_testnet_labels
            where address = e'\\xa6B0461b7E54Fa342Be6320D4938295A81f82Cd3'
            and label_name = 'Unstaked' 
            
            union all
            
            SELECT
                to_timestamp(block_timestamp) AS time,
                NULL AS address,  -- Set these fields to NULL to prevent blank values
                NULL AS amount,
                NULL AS pool_id,
                label_data->'args'->>'positionTokenID' AS position_token_id,
                'unstaking' AS label
            FROM game7_testnet_labels
            WHERE address = e'\\xa6B0461b7E54Fa342Be6320D4938295A81f82Cd3'
            AND label_name = 'initiateUnstake' 
        ),
        nft_tokenids as (
            select
            label_data->'args'->>'tokenId' as tokenid,
            label_data->'args'->>'to' as to_add,
            to_timestamp(block_timestamp) as time
            from game7_testnet_labels
            where address = e'\\xa6B0461b7E54Fa342Be6320D4938295A81f82Cd3'
            and label_name = 'Transfer'
        ),
        nft_token_latest as (
            select
            label_data->'args'->>'tokenId' as tokenid,
            max(to_timestamp(block_timestamp)) as latest_time
            from game7_testnet_labels
            where address = e'\\xa6B0461b7E54Fa342Be6320D4938295A81f82Cd3'
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
        where pool_id = $1
        ORDER BY pool_id ASC;
        `;
        console.log("run query", query);
        const result = await pool.query(query, [poolId]);
        console.log("result", result);
        return result.rows;
    } catch (error) {
        console.log("error", error);
        return String(error);
    }
}

// export async function getPlayerStats(nftAddress: string, nftTokenId: string): Promise<any> {
//     const allDataResponse: any[] | string = await getAllStats();
//     if (typeof allDataResponse == "string") {
//         return allDataResponse;
//     } else {
//         return playerFilter(allDataResponse, nftAddress, nftTokenId);
//     }
// }

// export async function getAllPitcherDistributions(): Promise<object | string> {
//     try {
//         const query = `
//             SELECT * FROM pitcher_distributions WHERE blockchain = 'wyrm';
//         `;
//         const result = await pool.query(query);
//         return result.rows;
//     } catch (error) {
//         return error.message;
//     }
// }

// export async function getPitcherDistribution(nftAddress: string, nftTokenId: string): Promise<any> {
//     const allDataResponse: any[] | string = await getAllPitcherDistributions();
//     if (typeof allDataResponse == "string") {
//         return allDataResponse;
//     } else {
//         return playerFilter(allDataResponse, nftAddress, nftTokenId);
//     }
// }

// export async function getAllBatterDistributions(): Promise<object | string> {
//     try {
//         const query = `
//             SELECT * FROM batter_distributions WHERE blockchain = 'wyrm';
//         `;
//         const result = await pool.query(query);
//         return result.rows;
//     } catch (error) {
//         return error.message;
//     }
// }

// export async function getBatterDistribution(nftAddress: string, nftTokenId: string): Promise<any> {
//     const allDataResponse: any[] | string = await getAllBatterDistributions();
//     if (typeof allDataResponse == "string") {
//         return allDataResponse;
//     } else {
//         return playerFilter(allDataResponse, nftAddress, nftTokenId);
//     }
// }
