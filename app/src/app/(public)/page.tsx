import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>Causelist app public site</p>
        <h3>
          <a href="/sign-in">sign in</a>
        </h3>
      </div>
    </main>
  );
}
