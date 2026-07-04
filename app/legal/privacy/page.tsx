export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="updated">Last updated: July 3, 2026</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details</strong> - name, email, and a hashed password if you create an account.</li>
        <li><strong>Order details</strong> - shipping name, address, and the design you submit, kept to produce and deliver your order.</li>
        <li><strong>Designs saved on your device</strong> - your in-progress design, favorites, and saved designs live in your browser&apos;s local storage, not on our servers, until you place an order.</li>
        <li><strong>Anonymous usage signals</strong> - which catalog categories get browsed, saved, remixed, and ordered. These signals contain no name, email, account id, or cookie - we use them only to decide which designs to add next.</li>
      </ul>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell or share your personal data with advertisers.</li>
        <li>We do not use third-party tracking cookies or advertising pixels.</li>
        <li>We do not store payment card details - payment is handled by a payment provider at confirmation time.</li>
      </ul>

      <h2>Emails</h2>
      <p>We send transactional emails only: order confirmations and status updates for orders you placed. Replying to any of them reaches us directly.</p>

      <h2>Your rights</h2>
      <p>You can update your name, email, and address from your profile at any time. To delete your account and its data, contact us from the email on your account and we will remove it within 30 days, except records we must keep for completed orders.</p>

      <h2>Security</h2>
      <p>Passwords are stored hashed (bcrypt), sessions use httpOnly cookies, and admin access is server-enforced. Uploaded artwork is sanitized before display.</p>
    </>
  );
}
