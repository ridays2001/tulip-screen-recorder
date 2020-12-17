const { writeFile } = require('fs');
const { desktopCapturer, remote } = require('electron');
const { Menu, dialog } = remote;

let mediaRecorder;
const recordedChunks = [];
const start = document.getElementById('start');
const stop = document.getElementById('stop');

const onStart = () => {
	mediaRecorder.start();
	start.classList.add('btn-warning');
	start.classList.remove('btn-primary');
	start.innerText = '⏺ Recording';
	stop.disabled = false;
	start.disabled = true;
};

const onStop = () => {
	mediaRecorder.stop();
	start.classList.add('btn-primary');
	start.classList.remove('btn-warning');
	start.innerText = '▶️ Start';
	stop.disabled = true;
	start.disabled = false;
};

const handleDataAvailable = (e) => recordedChunks.push(e.data);

const handleStop = async () => {
	const blob = new Blob(recordedChunks, {
		type: 'video/webm; codecs=vp9'
	});

	const { filePath } = await dialog.showSaveDialog({
		buttonLabel: 'Save Video',
		defaultPath: `Rec-${Date.now()}.webm`
	});
	writeFile(filePath, Buffer.from(await blob.arrayBuffer()), () => {});
};

const selectWindow = async (source) => {
	const videoSrc = document.getElementById('videoSrc');
	videoSrc.innerText = source.name;

	const video = document.querySelector('video');
	const stream = await navigator.mediaDevices.getUserMedia({
		audio: false,
		video: {
			mandatory: {
				chromeMediaSource: 'desktop',
				chromeMediaSourceId: source.id
			}
		}
	});

	video.srcObject = stream;
	video.play();
	start.disabled = false;

	mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
	mediaRecorder.ondataavailable = handleDataAvailable;
	mediaRecorder.onstop = handleStop;
};

const getWindows = async () => {
	const windows = await desktopCapturer.getSources({
		types: ['window', 'screen']
	});

	const optionsMenu = Menu.buildFromTemplate(
		windows.map((source) => ({ label: source.name, icon: source.thumbnail, click: () => selectWindow(source) }))
	);
	optionsMenu.popup();
};

const minimize = () => {
	const window = remote.getCurrentWindow();
	window.minimize();
};

const maximize = () => {
	const window = remote.getCurrentWindow();
	if (window.isMaximized()) return window.unmaximize();
	return window.maximize();
};

const kill = () => {
	const window = remote.getCurrentWindow();
	window.close();
};
