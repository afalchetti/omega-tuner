// tuner.js
// Guitar tuning app
// 
// Copyright (c) 2017, Angelo Falchetti. All rights reserved.

(function() {
"use strict";

navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia);

class Note 
{
	constructor(n, freq_ref=440, n_ref=48)
	{
		this.n=n;
		this.freq_ref=freq_ref;
		this.n_ref=n_ref;
	}

	toHertz()
	{
		return this.freq_ref * Math.pow(2, (this.n - this.n_ref) / 12)
	}

	toString()
	{
	const names = ["A", "A#", "B", "C", "C#", "D", "D#", "E",
                       "F", "F#", "G", "G#"];
	const octave = Math.floor((this.n+9)/12)
	const name_index =this.n % 12
		return names[name_index].concat(octave)
	}

	toCents()
	{
		return 100*this.n
	}
}

/// Generate and insert the tuner GUI to the DOM.
/// 
/// @param {jQuery} root - DOM element to insert the tuner into.
function create_GUI(root)
{
	const time = $("<canvas id='time' class='plot'></canvas>");
	const freq = $("<canvas id='freq' class='plot'></canvas>");
	root.append(time);
	root.append(freq);
}

/// Draw a data array into a canvas as a function of its index, matching the canvas width.
/// 
/// @param {Array} data - Data to render.
/// @param {CanvasRenderingContext2D} context - Drawing context.
function draw_array(data, context)
{
	const width  = context.canvas.width;
	const height = context.canvas.height;
	const dx     = width / data.length;
	
	context.clearRect(0, 0, width, height);
	
	context.linewidth   = 1;
	context.strokeStyle = "rgb(0, 0, 0)";
	
	context.beginPath();
	context.moveTo(0.0, data[0] * height / 256.0);
	
	for (let i = 1, x = dx; i < data.length; i++, x += dx) {
		const y = (255 - data[i]) * height / 256.0;
		context.lineTo(x, y);
	}
	
	context.stroke();
}

/// Connect the analyser audio node output to a suitable visualization.
/// 
/// @param {HTMLElement} time - DOM canvas that will be used to draw the time domain signal.
/// @param {HTMLElement} freq - DOM canvas that will be used to draw the frequency spectrum.
/// @param {AnalyserNode} analyser - WebAudio analyser which acts as a source of microphone data as well
///                                  as its Fourier transformation (frequency spectrum).
function setup_visualization(time, freq, analyser)
{
	analyser.fftSize = 16384;  // at 44.1kHz, this gives 5.4Hz resolution
	
	let time_ctx = time.getContext("2d");
	let freq_ctx = freq.getContext("2d");
	const tdata  = new Uint8Array(analyser.frequencyBinCount);
	const fdata  = new Uint8Array(analyser.frequencyBinCount);
	
	freq_ctx.canvas.width  = time_ctx.canvas.width  = time.width;
	freq_ctx.canvas.height = time_ctx.canvas.height = time.height;
	
	function draw()
	{
		analyser.getByteTimeDomainData(tdata);
		analyser.getByteFrequencyData (fdata);
		
		draw_array(tdata, time_ctx);
		draw_array(fdata, freq_ctx);
		
		requestAnimationFrame(draw);
	}
	
	draw();
}

/// Create all audio nodes and connect them to each other.
function create_audiograph()
{
	const context  = new (window.AudioContext || window.webkitAudioContext)();
	const analyser = context.createAnalyser();
	
	navigator.getUserMedia({audio: true},
		function (stream) {
			context.createMediaStreamSource(stream).connect(analyser);
			setup_visualization($("#time")[0], $("#freq")[0], analyser);
		},
		function (error) {
			console.log("Error while getting user media: " + error);
		});
}

/// Main entry point for the app.
function main()
{
	create_GUI($("#tuner"));
	create_audiograph();
}

$(document).ready(main);

})();
