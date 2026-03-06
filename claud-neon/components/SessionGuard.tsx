import React, { useEffect, useState } from 'react';

const SessionGuard = ({ trialDuration, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(trialDuration);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (timeLeft <= 0) {
            setIsExpired(true);
            onExpire();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, onExpire]);

    useEffect(() => {
        if (timeLeft === 300) {
            alert('Warning: 5 minutes remaining!');
        } else if (timeLeft === 120) {
            alert('Warning: 2 minutes remaining!');
        }
    }, [timeLeft]);

    if (isExpired) {
        return <div style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', height: '100%', width: '100%', position: 'fixed', top: 0, left: 0, zIndex: 1000 }}>
            <h1 style={{ color: 'white' }}>Trial Expired</h1>
        </div>;
    }

    return <div>
        <h2>Time Left: {timeLeft} seconds</h2>
    </div>;
};

export default SessionGuard;
