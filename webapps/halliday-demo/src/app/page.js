'use client'

import Image from "next/image";
import styles from "./page.module.css";

import { openHalliday } from "@halliday-sdk/commerce";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <a
          onClick={() => {
            openHalliday({
              apiKey: "4e6ccd6a-bd3b-4277-8fd4-591194980ccc",
              // Arbitrum
              destinationChainId: 42161,
              // USDC on Arbitrum
              destinationTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
              services: ["ONRAMP"],
            });
          }}
        >
          Click here to onramp with Halliday
        </a>
      </main>
    </div>
  );
}
