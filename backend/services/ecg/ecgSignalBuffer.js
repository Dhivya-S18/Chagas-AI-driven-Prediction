
const DEFAULT_WINDOW_SECONDS = 10;
const DEFAULT_SAMPLING_RATE = 250;
const DEFAULT_DISPLAY_SAMPLES = 500;

export class ECGSignalBuffer {
    constructor({
        samplingRate = DEFAULT_SAMPLING_RATE,
        windowSeconds = DEFAULT_WINDOW_SECONDS,
        displaySamples = DEFAULT_DISPLAY_SAMPLES,
        onWindow,
    } = {}) {
        this.samplingRate = samplingRate;
        this.windowSeconds = windowSeconds;
        this.windowSize = samplingRate * windowSeconds;
        this.displaySamples = displaySamples;
        this.onWindow = onWindow;

        this.samples = [];
        this.recentSamples = [];
    }

    addSample(sample) {
        const value = Number(sample);

        if (!Number.isFinite(value)) {
            return;
        }

        // Keep recent samples for live frontend display.
        this.recentSamples.push(value);

        if (this.recentSamples.length > this.displaySamples) {
            this.recentSamples =
                this.recentSamples.slice(-this.displaySamples);
        }

        // Keep samples for the ML processing window.
        this.samples.push(value);

        if (this.samples.length >= this.windowSize) {
            const window = this.samples.slice(0, this.windowSize);

            this.samples = this.samples.slice(this.windowSize);

            if (typeof this.onWindow === 'function') {
                this.onWindow(window);
            }
        }
    }

    addSamples(samples) {
        if (!Array.isArray(samples)) {
            return;
        }

        for (const sample of samples) {
            this.addSample(sample);
        }
    }

    getSampleCount() {
        return this.samples.length;
    }

    getRecentSamples() {
        return [...this.recentSamples];
    }

    clear() {
        this.samples = [];
        this.recentSamples = [];
    }
}
