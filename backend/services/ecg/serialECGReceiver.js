import { SerialPort } from 'serialport';

const DEFAULT_PORT = process.env.ECG_SERIAL_PORT || 'COM6';
const DEFAULT_BAUD_RATE = Number(process.env.ECG_SERIAL_BAUD_RATE || 115200);

let serialPort = null;
let buffer = '';

export function startECGSerialReceiver({
    port = DEFAULT_PORT,
    baudRate = DEFAULT_BAUD_RATE,
    onSample,
} = {}) {
    if (serialPort?.isOpen) {
        return serialPort;
    }

    serialPort = new SerialPort({
        path: port,
        baudRate,
        autoOpen: false,
    });

    serialPort.on('open', () => {
        console.log(`ECG serial connected: ${port} @ ${baudRate}`);
    });

    serialPort.on('data', (chunk) => {
        buffer += chunk.toString();

        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';

        for (const line of lines) {
            const value = Number(line.trim());

            if (!Number.isFinite(value)) {
                continue;
            }

            if (typeof onSample === 'function') {
                onSample(value);
            }
        }
    });

    serialPort.on('error', (error) => {
        console.error('ECG serial error:', error.message);
    });

    serialPort.on('close', () => {
        console.log('ECG serial disconnected.');
    });

    serialPort.open((error) => {
        if (error) {
            console.error(
                `Unable to open ECG serial port ${port}:`,
                error.message,
            );
        }
    });

    return serialPort;
}

export function stopECGSerialReceiver() {
    if (!serialPort) {
        return;
    }

    if (serialPort.isOpen) {
        serialPort.close();
    }

    serialPort = null;
    buffer = '';
}

export function getECGSerialStatus() {
    return {
        connected: Boolean(serialPort?.isOpen),
        port: DEFAULT_PORT,
        baudRate: DEFAULT_BAUD_RATE,
    };
}