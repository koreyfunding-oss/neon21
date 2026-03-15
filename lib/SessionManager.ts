// SessionManager: lightweight client-side payment wall visibility controller.
// The primary trial logic lives in useTrialTimer.ts; this class is used for
// programmatic paywall control outside of the React hook lifecycle.
export class SessionManager {
    private timerDuration: number;
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
    }

    hidePaymentWall() {
        this.paymentWallVisible = false;
    }

    isPaymentWallVisible() {
        return this.paymentWallVisible;
    }
}
