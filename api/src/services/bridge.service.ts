// src/services/bridge.service.ts
import { pool } from '../utils/db'; // Adjust the import path as necessary

export async function getTransactionHistory(address: string): Promise<object | string> {
  const tableNameGame7 = 'game7_testnet_labels'; // Adjust the table name as necessary
  const tableNameEthereum = 'sepolia_labels'; // Adjust the table name as necessary
  const tableNameArbitrum = 'arbitrum_sepolia_labels'; // Adjust the table name as necessary
  const addressHex = 'a6B0461b7E54Fa342Be6320D4938295A81f82Cd3'; // Adjust the address as necessary
  try {
    const query = `
    SELECT * FROM (
      SELECT transaction_hash, '0x' || ENCODE(origin_address, 'hex') AS from_address, '0x' || ENCODE(origin_address, 'hex') AS to_address, '' AS token, label_data->'args'->>'amount' AS amount, 'from_l2_to_l3 deposit' AS type, block_number
      FROM ${tableNameArbitrum}
      WHERE label='seer' AND address=DECODE($1, 'hex') AND label_name = 'depositERC20'

      UNION ALL

      SELECT transaction_hash, label_data->'args'->>'caller' AS from_address, label_data->'args'->>'destination' AS to_address, '' AS token, label_data->'args'->>'callvalue' AS amount, 'from_l3_to_l2 withdraw' AS type, block_number
      FROM ${tableNameGame7}
      WHERE label='seer' AND address=DECODE('0000000000000000000000000000000000000064', 'hex') AND label_name = 'L2ToL1Tx'

      UNION ALL

      SELECT transaction_hash, label_data->'args'->>'l2Sender' AS from_address, label_data->'args'->>'to' AS to_address, '' AS token, label_data->'args'->>'value' AS amount, 'from_l3_to_l2 claim' AS type, block_number
      FROM ${tableNameArbitrum}
      WHERE label='seer' AND label_name = 'executeTransaction'

      UNION ALL

      SELECT transaction_hash, label_data->'args'->>'_from' AS from_address, label_data->'args'->>'_to' AS to_address, label_data->'args'->>'l1Token' AS token, label_data->'args'->>'_amount' AS amount, 'from_l1_to_l2 deposit' AS type, block_number
      FROM ${tableNameEthereum}
      WHERE label='seer' AND label_name = 'DepositInitiated'

      UNION ALL

      SELECT transaction_hash, label_data->'args'->>'_from' AS from_address, label_data->'args'->>'_to' AS to_address, label_data->'args'->>'l1Token' AS token, label_data->'args'->>'_amount' AS amount, 'from_l2_to_l1 withdraw' AS type, block_number
      FROM ${tableNameArbitrum}
      WHERE label='seer' AND label_name = 'WithdrawalInitiated'

      UNION ALL

      SELECT transaction_hash, label_data->'args'->>'_from' AS from_address, label_data->'args'->>'_to' AS to_address, label_data->'args'->>'l1Token' AS token, label_data->'args'->>'_amount' AS amount, 'from_l2_to_l1 claim' AS type, block_number
      FROM ${tableNameEthereum}
      WHERE label='seer' AND label_name = 'WithdrawalFinalized'
    ) AS t
    WHERE t.from_address = $2 OR t.to_address = $2
    ORDER BY block_number DESC
  `;
    const result = await pool.query(query, [addressHex, address]);
    return result.rows;
  } catch (error) {
    console.error('Error:', error);
    throw new Error(String(error));
  }
}