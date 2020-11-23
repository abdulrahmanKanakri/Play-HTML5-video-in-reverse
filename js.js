var videos = {};

function getElement(base, clnm) {
    var ary = base.getElementsByClassName(clnm);
    if (ary.length != 1) return null;
    return ary[0];
}

function InitControls(video) {
    var cur = video;

    do {
        cur = cur.parentNode;
    } while (cur && cur.className != 'VideoControls');
    if (!cur) {
        alert("No container with class VideoControls found for video " + video.id);
        console.error("error here");
        return;
    }
    if (video.id in videos) return;
    var videopos = getElement(cur, 'videopos');
    if (!videopos) {
        alert("no distinct " + (videopos ? "videopos" : "") + (videopos ? " and " : "") + " object found for video " + video.id);
        console.error("error here");
        return;
    }
    videopos.max = video.duration;
    videopos.style.width = video.videoWidth; // video.offsetWidth || video.innerWidth; 
    var buttons = {},
        bno, elmt, buttonClasses = ['up', 'down'];
    for (bno in buttonClasses) {
        elmt = getElement(cur, buttonClasses[bno]);
        if (elmt) buttons[buttonClasses[bno]] = elmt;
        else {
            alert("not found:" + buttonClasses[bno]); 
            console.error("error here");
        }
    }
    
    videos[video.id] = {
        'videopos': videopos,
        'rewinding': false,
        'last_frame_shown': true,
        'rewindTimer': null,
        'rewindStartTime': null,
        'rewindStartPos': null,
        'ratedelta': 0,
        'buttons': buttons,
        'video': video
    };
    
    video.addEventListener('timeupdate', UpdateTime, false)
}

var rewind_speed = 1;

function UpdateTime(e) {
    var video = e.target;
    var rec = videos[video.id];
    if (
        rec.last_frame_shown && 
        rec.rewinding && 
        (
            rec.videopos.value < video.currentTime - 25 / 1000.0 || 
            video.currentTime + 25 / 1000.0 < rec.videopos.value
        )
    ) {
        video.currentTime = rec.videopos.value;
        rec.last_frame_shown = false;
    } else {
        rec.last_frame_shown = true;
    }
    rec.videopos.value = video.currentTime;
}

function ShowFrameWhileRewinding(rec) {
    var timediff = new Date().getTime() - rec.rewindStartTime;
    var newpos = rec.rewindStartPos - (timediff * rewind_speed / 1000.0);
    if (newpos < 0) {
        newpos = 0;
        StopRewinding(rec);
    }
    if (rec.last_frame_shown) {
        rec.video.currentTime = newpos;
        rec.last_frame_shown = false;
    }
    rec.videopos.value = newpos;
}

function StartRewinding(rec, but) {
    rec.rewindStartTime = new Date().getTime(); // in ms
    rec.rewindStartPos = rec.video.currentTime;
    if (rec.rewindTimer === null) {
        rec.rewindTimer = setInterval(ShowFrameWhileRewinding, 1000 / 25, rec);
    }
    rec.rewinding = true;
}

function StopRewinding(rec) {
    clearInterval(rec.rewindTimer);
    rec.rewindTimer = null;
    rec.rewinding = false;
}

function PlayPause(video, but, rate) {
    var rec = videos[video.id];
    if (rate < 0) {
        var playing = !video.paused || rec.rewinding;
        video.pause();
        if (playing && rec.rewinding) StopRewinding(rec);
        else StartRewinding(rec, but);
    } else {
        if (rec.rewinding) StopRewinding(rec);
        if (video.paused || video.playbackRate + rec.ratedelta != rate) PlayVideo(rec, video, rate);
        else PauseVideo(video);
    }
}

function PlayVideo(rec, video, rate) {
    if (video.paused) video.play();
    video.playbackRate = rate;
    rec.ratedelta = rate - video.playbackRate;
}

function PauseVideo(video) {
    video.pause();
}

function GotoPos(video, newpos) {
    var rec = videos[video.id];
    if (rec.rewinding) StopRewinding(rec);
    else if (!video.paused) PauseVideo(rec, video);
    video.currentTime = newpos;
}
