function About() {
  return (
    <div className="about-page panel">
      <div className="section-header">
        <h3>About</h3>
      </div>

      <p className="card-note">
        This app helps you review monitoring activity, recent ECG recordings, AI analysis status, and downloadable reports for your account.
      </p>

      <div className="about-section">
        <h4>Current experience</h4>
        <p className="card-note">
          The monitor currently uses a simulated DEMO ECG signal. Real hardware and verified ML output are not available yet.
        </p>
      </div>

      <div className="about-section">
        <h4>What you can do</h4>
        <ul className="workflow-list">
          <li>Review your monitoring history</li>
          <li>Check current AI analysis status</li>
          <li>Generate a PDF report for a date range</li>
          <li>Use the demo monitor while the live signal integration remains pending</li>
        </ul>
      </div>
    </div>
  );
}

export default About;
