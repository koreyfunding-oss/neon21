class SessionManager {
    private timerDuration: number; // duration in milliseconds
    private paymentWallVisible: boolean = false;

    constructor(timerDuration: number) {
        this.timerDuration = timerDuration;
    }

    startTimer() {
        setTimeout(() => {
            this.showPaymentWall();
        }, this.timerDuration);
    }

    showPaymentWall() {
        this.paymentWallVisible = true;
        console.log("Payment wall is now visible.");
    }

    hidePaymentWall() {
        this.paymentWallVisible = false;
        console.log("Payment wall is now hidden.");
    }

    isPaymentWallVisible() {
        return this.paymentWallVisible;
    }

    // Add additional methods as needed
}

// Example usage
const sessionManager = new SessionManager(30000); // 30 seconds timer
sessionManager.startTimer();
