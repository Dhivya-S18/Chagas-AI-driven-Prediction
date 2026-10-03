function About() {
  return (
    <div className="about-page panel">
      <div className="section-header">
        <h3>Project title</h3>
      </div>
      <p className="card-note">Personal ECG monitoring with a DEMO signal, user-owned history, and downloadable reports.</p>

      <div className="about-section">
        <h4>Project objective</h4>
        <p className="card-note">The current monitor demonstrates a simulated ECG waveform. ESP32 input and ML-based analysis are future integrations.</p>
      </div>

      <div className="about-section">
        <h4>System workflow</h4>
        <ol className="workflow-list">
          <li>User account and JWT authentication</li>
          <li>DEMO ECG monitor</li>
          <li>Backend API and MongoDB</li>
          <li>User-owned monitoring history</li>
          <li>PDF reports</li>
          <li>Future signal processing and ML integration</li>
          <li>ESP32 not connected</li>
        </ol>
      </div>

      <div className="about-section">
        <h4>Core components</h4>
        <p className="card-note">Only the waveform demo runs today. No AI predictions, alerts, or hardware connections are generated.</p>
      </div>
    </div>
  );
}

export default About;
