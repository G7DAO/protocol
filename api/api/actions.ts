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
            select transaction_hash, label_data->'args'->>'_from' as from_address, label_data->'args'->>'_to' as to_address, label_data->'args'->>'l1Token' as token, label_data->'args'->>'_amount' as amount, 'from_l1_to_l2' as type, block_number from sepolia_labels where label='seer' and label_name = 'DepositInitiated'
            UNION ALL
            select transaction_hash, label_data->'args'->>'_from' as from_address, label_data->'args'->>'_to' as to_address, label_data->'args'->>'l1Token' as token, label_data->'args'->>'_amount' as amount, 'from_l2_to_l1' as type, block_number from arbitrum_sepolia_labels where label='seer' and label_name = 'WithdrawalInitiated'
            UNION ALL
            select transaction_hash, '0x' || ENCODE(origin_address, 'hex') as from_address, '0x' || ENCODE(origin_address, 'hex') as to_address, '', label_data->'args'->>'amount' as amount, 'from_l2_to_l3' as type, block_number from arbitrum_sepolia_labels where label='seer' and address=DECODE('e6470bb72291c39073aed67a30ff93b69c1f47de', 'hex')  and label_name = 'depositERC20'
            UNION ALL
            select transaction_hash, label_data->'args'->>'caller' as from_address, label_data->'args'->>'destination' as to_address, '', label_data->'args'->>'callvalue' as amount, 'from_l3_to_l2' as type, block_number from game7_testnet_labels where label='seer' and address=DECODE('0000000000000000000000000000000000000064', 'hex')  and label_name = 'L2ToL1Tx'
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
