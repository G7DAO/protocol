// src/services/bridge.service.ts
import { pool } from '../utils/db'; // Adjust the import path as necessary

export async function getTransactionHistory(address: string): Promise<object | string> {
    try {
        const query = `
      SELECT * FROM (
        SELECT transaction_hash, '0x' || ENCODE(origin_address, 'hex') AS from_address, '0x' || ENCODE(origin_address, 'hex') AS to_address, '' AS token, label_data->'args'->>'amount' AS amount, 'from_l2_to_l3 deposit' AS type, block_number
        FROM arbitrum_sepolia_labels
        WHERE label='seer' AND address=DECODE('e6470bb72291c39073aed67a30ff93b69c1f47de', 'hex') AND label_name = 'depositERC20'

        UNION ALL

        SELECT transaction_hash, label_data->'args'->>'caller' AS from_address, label_data->'args'->>'destination' AS to_address, '' AS token, label_data->'args'->>'callvalue' AS amount, 'from_l3_to_l2 withdraw' AS type, block_number
        FROM game7_testnet_labels
        WHERE label='seer' AND address=DECODE('0000000000000000000000000000000000000064', 'hex') AND label_name = 'L2ToL1Tx'

        UNION ALL

        SELECT transaction_hash, label_data->'args'->>'l2Sender' AS from_address, label_data->'args'->>'to' AS to_address, '' AS token, label_data->'args'->>'value' AS amount, 'from_l3_to_l2 claim' AS type, block_number
        FROM arbitrum_sepolia_labels
        WHERE label='seer' AND label_name = 'executeTransaction'

        UNION ALL

        SELECT transaction_hash, label_data->'args'->>'_from' AS from_address, label_data->'args'->>'_to' AS to_address, label_data->'args'->>'l1Token' AS token, label_data->'args'->>'_amount' AS amount, 'from_l1_to_l2 deposit' AS type, block_number
        FROM sepolia_labels
        WHERE label='seer' AND label_name = 'DepositInitiated'

        UNION ALL

        SELECT transaction_hash, label_data->'args'->>'_from' AS from_address, label_data->'args'->>'_to' AS to_address, label_data->'args'->>'l1Token' AS token, label_data->'args'->>'_amount' AS amount, 'from_l2_to_l1 withdraw' AS type, block_number
        FROM arbitrum_sepolia_labels
        WHERE label='seer' AND label_name = 'WithdrawalInitiated'

        UNION ALL

        SELECT transaction_hash, label_data->'args'->>'_from' AS from_address, label_data->'args'->>'_to' AS to_address, label_data->'args'->>'l1Token' AS token, label_data->'args'->>'_amount' AS amount, 'from_l2_to_l1 claim' AS type, block_number
        FROM sepolia_labels
        WHERE label='seer' AND label_name = 'WithdrawalFinalized'
      ) AS t
      WHERE t.from_address = $1 OR t.to_address = $1
      ORDER BY block_number DESC
    `;
        console.log('Running query:', query);
        const result = await pool.query(query, [address]);
        console.log('Result:', result.rows);
        return result.rows;
    } catch (error) {
        console.error('Error:', error);
        throw new Error(String(error));
    }
}