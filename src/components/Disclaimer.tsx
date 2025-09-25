import React from 'react'
import './Disclaimer.css'

const Disclaimer: React.FC = () => {
  return (
    <footer className="disclaimer">
      <div className="disclaimer-content">

        <div className="disclaimer-details">
          <div className="disclaimer-section">
            <h5>Feaures</h5>
            <ul>
              <li>Multi-camera synchronized playback</li>
              <li>Grid view or camera-focus view</li>
              <li>Event information, location, and navigation</li>
            </ul>
          </div>
          <div className="disclaimer-section">
            <h5>Privacy & Security Notice</h5>
            <ul>
              <li>🔒 All video processing happens entirely in your browser.</li>
            </ul>
          </div>
          <div className="disclaimer-section">
            <h5>Browser Requirements</h5>
            <ul>
              <li>A modern browser with mp4 codec support</li>
              <li>Chrome, Edge, Firefox, and Safari</li>
            </ul>
          </div>
        </div>
        
        <div className="disclaimer-footer">
          <p>
            This application is not affiliated with Tesla, Inc. 
            Tesla and the Tesla logo are trademarks of Tesla, Inc.
          </p>
          <p className="disclaimer-version">
            Created by <a href="https://github.com/bk201">bK201</a> &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Disclaimer