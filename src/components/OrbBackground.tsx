import React from 'react';

interface OrbBackgroundProps {
  children?: React.ReactNode;
}

const OrbBackground: React.FC<OrbBackgroundProps> = ({ children }) => (
  <>
    <div className="orb-bg">
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />
      <div className="orb orb4" />
    </div>
    {children}
  </>
);

export default OrbBackground;
