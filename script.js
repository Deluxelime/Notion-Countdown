const targetInput = document.getElementById('target-date');
const targetTimeInput = document.getElementById('target-time');
const durationInput = document.getElementById('duration-input');
const startButton = document.getElementById('start-button');
const datePanel = document.getElementById('date-panel');
const durationPanel = document.getElementById('duration-panel');
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');
const status = document.getElementById('status');
const eventNameInput = document.getElementById('event-name');
const eventTitle = document.getElementById('event-title');
const saveStatus = document.getElementById('save-status');
const values = {
	days: document.getElementById('days'),
	hours: document.getElementById('hours'),
	minutes: document.getElementById('minutes'),
	seconds: document.getElementById('seconds')
};

let timerId;
let isPaused = false;
let remainingSeconds = 0;
let mode = 'date';
const storageKey = 'countdown-widget-config';

function format(value) {
	return String(value).padStart(2, '0');
}

function showTime(totalSeconds) {
	totalSeconds = Math.max(0, totalSeconds);
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	values.days.textContent = format(days);
	values.hours.textContent = format(hours);
	values.minutes.textContent = format(minutes);
	values.seconds.textContent = format(seconds);
}

function stopTimer() {
	clearInterval(timerId);
	timerId = undefined;
}

function saveConfiguration() {
	const configuration = {
		eventName: eventNameInput.value,
		mode,
		targetDate: targetInput.value,
		targetTime: targetTimeInput.value,
		duration: durationInput.value
	};
	localStorage.setItem(storageKey, JSON.stringify(configuration));
	saveStatus.textContent = 'Saved on this device.';
}

function applyMode(nextMode) {
	mode = nextMode;
	document.querySelectorAll('.mode-button').forEach((modeButton) => modeButton.classList.toggle('active', modeButton.dataset.mode === mode));
	datePanel.classList.toggle('hidden', mode !== 'date');
	durationPanel.classList.toggle('hidden', mode !== 'duration');
}

function updateCountdown() {
	if (isPaused || remainingSeconds <= 0) return;

	remainingSeconds -= 1;
	showTime(remainingSeconds);

	if (remainingSeconds <= 0) {
		stopTimer();
		pauseButton.disabled = true;
		status.textContent = 'Timer finished.';
		status.classList.add('finished');
	}
}

function startTimer(seconds) {
	stopTimer();
	isPaused = false;
	status.classList.remove('finished');
	remainingSeconds = seconds;
	showTime(remainingSeconds);
	pauseButton.disabled = false;
	pauseButton.textContent = 'Pause';
	status.textContent = mode === 'date' ? 'Counting down to your target...' : 'Timer running...';
	timerId = setInterval(updateCountdown, 1000);
}

function startCountdown() {
	const target = new Date(`${targetInput.value}T${targetTimeInput.value || '00:00'}`).getTime();
	if (!targetInput.value || !Number.isFinite(target) || target <= Date.now()) {
		showTime(0);
		pauseButton.disabled = true;
		status.textContent = 'Choose a future target date.';
		status.classList.add('finished');
		return;
	}
	startTimer(Math.ceil((target - Date.now()) / 1000));
}

function startDurationTimer() {
	const minutes = Number(durationInput.value);
	if (!Number.isFinite(minutes) || minutes <= 0) {
		pauseButton.disabled = true;
		status.textContent = 'Enter a duration greater than zero.';
		return;
	}
	startTimer(Math.round(minutes * 60));
}

function resetTimer() {
	stopTimer();
	remainingSeconds = 0;
	isPaused = false;
	pauseButton.disabled = true;
	pauseButton.textContent = 'Pause';
	status.textContent = mode === 'date' ? 'Choose a target date to begin.' : 'Choose a duration to begin.';
	status.classList.remove('finished');
	showTime(0);
}

document.querySelectorAll('.mode-button').forEach((button) => {
	button.addEventListener('click', () => {
		applyMode(button.dataset.mode);
		resetTimer();
		saveConfiguration();
	});
});

eventNameInput.addEventListener('input', () => {
	eventTitle.textContent = eventNameInput.value.trim() || 'Countdown';
	saveConfiguration();
});
targetInput.addEventListener('change', () => {
	startCountdown();
	saveConfiguration();
});
targetTimeInput.addEventListener('change', () => {
	startCountdown();
	saveConfiguration();
});
startButton.addEventListener('click', startDurationTimer);
durationInput.addEventListener('keydown', (event) => {
	if (event.key === 'Enter') startDurationTimer();
});
durationInput.addEventListener('input', saveConfiguration);
document.querySelectorAll('.preset').forEach((button) => {
	button.addEventListener('click', () => {
		durationInput.value = button.dataset.minutes;
		document.querySelectorAll('.preset').forEach((preset) => preset.classList.remove('selected'));
		button.classList.add('selected');
		startDurationTimer();
		saveConfiguration();
	});
});

pauseButton.addEventListener('click', () => {
	if (remainingSeconds <= 0) return;
	isPaused = !isPaused;
	pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
	status.textContent = isPaused ? 'Timer paused.' : 'Timer running...';
});

resetButton.addEventListener('click', () => {
	resetTimer();
	targetInput.value = '';
	targetTimeInput.value = '';
	durationInput.value = '';
	document.querySelectorAll('.preset').forEach((preset) => preset.classList.remove('selected'));
	saveConfiguration();
});

try {
	const savedConfiguration = JSON.parse(localStorage.getItem(storageKey));
	if (savedConfiguration) {
		eventNameInput.value = savedConfiguration.eventName || '';
		eventTitle.textContent = eventNameInput.value.trim() || 'Countdown';
		targetInput.value = savedConfiguration.targetDate || '';
		targetTimeInput.value = savedConfiguration.targetTime || '';
		durationInput.value = savedConfiguration.duration || '';
		applyMode(savedConfiguration.mode === 'duration' ? 'duration' : 'date');
		if (mode === 'date' && targetInput.value) startCountdown();
	}
} catch (error) {
	saveStatus.textContent = 'Configuration could not be restored.';
}
