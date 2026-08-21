const elements = {
	targetDate: document.getElementById('target-date'),
	targetTime: document.getElementById('target-time'),
	duration: document.getElementById('duration-input'),
	start: document.getElementById('start-button'),
	datePanel: document.getElementById('date-panel'),
	durationPanel: document.getElementById('duration-panel'),
	reset: document.getElementById('reset-button'),
	status: document.getElementById('status'),
	eventName: document.getElementById('event-name'),
	title: document.getElementById('event-title'),
	meta: document.getElementById('countdown-meta'),
	saveStatus: document.getElementById('save-status'),
	select: document.getElementById('countdown-select'),
	newCountdown: document.getElementById('new-countdown-button'),
	deleteCountdown: document.getElementById('delete-countdown-button'),
	themeButton: document.getElementById('theme-button'),
	themeSelect: document.getElementById('theme-select'),
	displayFormat: document.getElementById('display-format'),
	accentColor: document.getElementById('accent-color'),
	backgroundColor: document.getElementById('background-color'),
	soundToggle: document.getElementById('sound-toggle'),
	notificationButton: document.getElementById('notification-button'),
	values: {
		days: document.getElementById('days'),
		hours: document.getElementById('hours'),
		minutes: document.getElementById('minutes'),
		seconds: document.getElementById('seconds')
	}
};

const storageKey = 'countdown-widget-config';
let timerId;
let audioContext;
let state = loadState();

function createCountdown(name = 'Countdown') {
	return {
		id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
		name,
		mode: 'date',
		targetDate: '',
		targetTime: '',
		duration: '',
		endTime: null,
		remainingSeconds: 0,
		finished: false
	};
}

function loadState() {
	const fallback = { theme: 'light', displayFormat: 'full', accent: '#e85d04', background: '#f6f1e8', sound: true, activeId: '', countdowns: [] };
	try {
		const saved = JSON.parse(localStorage.getItem(storageKey));
		if (saved && Array.isArray(saved.countdowns) && saved.countdowns.length > 0) return { ...fallback, ...saved, countdowns: saved.countdowns };
		if (saved) {
			const legacy = createCountdown(saved.eventName || 'Countdown');
			Object.assign(legacy, saved);
			return { ...fallback, ...saved, activeId: legacy.id, countdowns: [legacy] };
		}
	} catch (error) {
		elements.saveStatus.textContent = 'Configuration could not be restored.';
	}
	const first = createCountdown();
	return { ...fallback, activeId: first.id, countdowns: [first] };
}

function currentCountdown() {
	return state.countdowns.find((countdown) => countdown.id === state.activeId) || state.countdowns[0];
}

function saveState() {
	try {
		localStorage.setItem(storageKey, JSON.stringify(state));
		elements.saveStatus.textContent = 'Saved on this device.';
	} catch (error) {
		elements.saveStatus.textContent = 'Storage is unavailable in this embed.';
	}
}

function format(value) {
	return String(Math.max(0, value)).padStart(2, '0');
}

function showTime(totalSeconds) {
	const seconds = Math.max(0, Math.floor(totalSeconds));
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	elements.values.days.textContent = format(days);
	elements.values.hours.textContent = format(state.displayFormat === 'clock' ? (days * 24 + hours) : hours);
	elements.values.minutes.textContent = format(minutes);
	elements.values.seconds.textContent = format(seconds % 60);
	elements.values.days.parentElement.classList.toggle('is-hidden', state.displayFormat === 'clock');
	document.body.dataset.format = state.displayFormat;
	const countdown = currentCountdown();
	if (countdown) countdown.remainingSeconds = seconds;
}

function stopTimer() {
	clearInterval(timerId);
	timerId = undefined;
}

function updateTitle() {
	const countdown = currentCountdown();
	elements.title.textContent = countdown.name.trim() || 'Countdown';
	elements.eventName.value = countdown.name;
	elements.meta.textContent = countdown.mode === 'date' ? 'Your next moment, made visible.' : 'A little time, held for you.';
}

function renderCountdownList() {
	elements.select.innerHTML = state.countdowns.map((countdown) => `<option value="${countdown.id}">${escapeHtml(countdown.name.trim() || 'Untitled countdown')}</option>`).join('');
	elements.select.value = state.activeId;
	elements.deleteCountdown.disabled = state.countdowns.length === 1;
}

function escapeHtml(value) {
	return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function applyMode() {
	const countdown = currentCountdown();
	document.querySelectorAll('.mode-button').forEach((button) => button.classList.toggle('active', button.dataset.mode === countdown.mode));
	elements.datePanel.classList.toggle('hidden', countdown.mode !== 'date');
	elements.durationPanel.classList.toggle('hidden', countdown.mode !== 'duration');
}

function updateCountdown() {
	const countdown = currentCountdown();
	if (!countdown || countdown.remainingSeconds <= 0) return;
	countdown.remainingSeconds = countdown.endTime === null ? countdown.remainingSeconds - 1 : Math.max(0, Math.ceil((countdown.endTime - Date.now()) / 1000));
	showTime(countdown.remainingSeconds);
	if (countdown.remainingSeconds <= 0) finishTimer();
}

function finishTimer() {
	const countdown = currentCountdown();
	stopTimer();
	countdown.endTime = null;
	countdown.finished = true;
	elements.status.textContent = 'Timer finished.';
	elements.status.classList.add('finished');
	if (state.sound) playFinishSound();
	if ('Notification' in window && Notification.permission === 'granted') new Notification(`${countdown.name || 'Countdown'} finished`);
	saveState();
}

function playFinishSound() {
	try {
		audioContext ||= new AudioContext();
		const oscillator = audioContext.createOscillator();
		const gain = audioContext.createGain();
		oscillator.frequency.value = 660;
		gain.gain.setValueAtTime(0.001, audioContext.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
		gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);
		oscillator.connect(gain).connect(audioContext.destination);
		oscillator.start();
		oscillator.stop(audioContext.currentTime + 0.6);
	} catch (error) {
	}
}

function startTimer(seconds) {
	const countdown = currentCountdown();
	stopTimer();
	countdown.finished = false;
	countdown.remainingSeconds = seconds;
	countdown.endTime = Date.now() + seconds * 1000;
	elements.status.classList.remove('finished');
	elements.status.textContent = countdown.mode === 'date' ? 'Counting down to your target...' : 'Timer running...';
	showTime(seconds);
	timerId = setInterval(updateCountdown, 1000);
	saveState();
}

function startCountdown() {
	const countdown = currentCountdown();
	const target = new Date(`${countdown.targetDate}T${countdown.targetTime || '00:00'}`).getTime();
	if (!countdown.targetDate || !Number.isFinite(target) || target <= Date.now()) {
		stopTimer();
		countdown.endTime = null;
		countdown.remainingSeconds = 0;
		showTime(0);
		elements.status.textContent = 'Choose a future target date.';
		elements.status.classList.add('finished');
		return;
	}
	startTimer(Math.ceil((target - Date.now()) / 1000));
}

function startDurationTimer() {
	const minutes = Number(currentCountdown().duration);
	if (!Number.isFinite(minutes) || minutes <= 0) {
		elements.status.textContent = 'Enter a duration greater than zero.';
		return;
	}
	startTimer(Math.round(minutes * 60));
}

function resetTimer(clearInputs = false) {
	const countdown = currentCountdown();
	stopTimer();
	countdown.remainingSeconds = 0;
	countdown.endTime = null;
	countdown.finished = false;
	elements.status.textContent = countdown.mode === 'date' ? 'Choose a target date to begin.' : 'Choose a duration to begin.';
	elements.status.classList.remove('finished');
	if (clearInputs) {
		countdown.targetDate = '';
		countdown.targetTime = '';
		countdown.duration = '';
	}
	showTime(0);
	saveState();
}

function render() {
	const countdown = currentCountdown();
	if (!countdown) return;
	updateTitle();
	renderCountdownList();
	applyMode();
	elements.targetDate.value = countdown.targetDate;
	elements.targetTime.value = countdown.targetTime;
	elements.duration.value = countdown.duration;
	elements.themeSelect.value = state.theme;
	elements.displayFormat.value = state.displayFormat;
	elements.accentColor.value = state.accent;
	elements.backgroundColor.value = state.background;
	elements.soundToggle.checked = state.sound;
	document.body.dataset.theme = state.theme;
	document.documentElement.style.setProperty('--accent', state.accent);
	document.documentElement.style.setProperty('--page-color', state.background);
	showTime(countdown.remainingSeconds);
}

document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', () => {
	currentCountdown().mode = button.dataset.mode;
	resetTimer();
	applyMode();
}));

elements.eventName.addEventListener('input', () => {
	currentCountdown().name = elements.eventName.value;
	updateTitle();
	renderCountdownList();
	saveState();
});

elements.targetDate.addEventListener('change', () => { currentCountdown().targetDate = elements.targetDate.value; startCountdown(); saveState(); });
elements.targetTime.addEventListener('change', () => { currentCountdown().targetTime = elements.targetTime.value; startCountdown(); saveState(); });
elements.duration.addEventListener('input', () => { currentCountdown().duration = elements.duration.value; saveState(); });
elements.duration.addEventListener('keydown', (event) => { if (event.key === 'Enter') startDurationTimer(); });
elements.start.addEventListener('click', startDurationTimer);
document.querySelectorAll('.preset').forEach((button) => button.addEventListener('click', () => { currentCountdown().duration = button.dataset.minutes; elements.duration.value = button.dataset.minutes; startDurationTimer(); }));

elements.reset.addEventListener('click', () => resetTimer(true));
elements.select.addEventListener('change', () => { stopTimer(); state.activeId = elements.select.value; render(); saveState(); });
elements.newCountdown.addEventListener('click', () => {
	const countdown = createCountdown(`Countdown ${state.countdowns.length + 1}`);
	state.countdowns.push(countdown);
	state.activeId = countdown.id;
	render();
	saveState();
});
elements.deleteCountdown.addEventListener('click', () => {
	if (state.countdowns.length === 1) return;
	stopTimer();
	state.countdowns = state.countdowns.filter((countdown) => countdown.id !== state.activeId);
	state.activeId = state.countdowns[0].id;
	render();
	saveState();
});

elements.themeButton.addEventListener('click', () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; render(); saveState(); });
elements.themeSelect.addEventListener('change', () => { state.theme = elements.themeSelect.value; render(); saveState(); });
elements.displayFormat.addEventListener('change', () => { state.displayFormat = elements.displayFormat.value; render(); saveState(); });
elements.accentColor.addEventListener('input', () => { state.accent = elements.accentColor.value; render(); saveState(); });
elements.backgroundColor.addEventListener('input', () => { state.background = elements.backgroundColor.value; render(); saveState(); });
elements.soundToggle.addEventListener('change', () => { state.sound = elements.soundToggle.checked; saveState(); });
elements.notificationButton.addEventListener('click', async () => {
	if (!('Notification' in window)) { elements.notificationButton.textContent = 'Notifications unavailable'; return; }
	const permission = await Notification.requestPermission();
	elements.notificationButton.textContent = permission === 'granted' ? 'Notifications enabled' : 'Notifications blocked';
});

render();
const restored = currentCountdown();
if (restored.mode === 'date' && restored.targetDate) startCountdown();
else if (restored.mode === 'duration' && restored.remainingSeconds > 0) {
	restored.endTime = restored.endTime || Date.now() + restored.remainingSeconds * 1000;
	timerId = setInterval(updateCountdown, 1000);
}
