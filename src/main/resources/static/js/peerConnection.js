var connectionState = {};
var configuration = {
    'iceServers': [{
        'urls': 'stun:stun.l.google.com:19302'
    }]
};

function processConnections(partyName, id, latestConns) {
    var allReady = (latestConns.length == 3);

    latestConns.forEach( function(conn) {
        var connId = getId(conn);
        if( connectionState[connId] == undefined ) {
            connectionState[connId] = { initiator: conn.initiator, acceptor: conn.acceptor };
        }

        if( id == conn.initiator ) {
            processInitiator(partyName, conn);
            allReady = allReady && (connectionState[connId].state == "READY_INITIATOR")
        } else {
            processAcceptor(partyName, conn);
            allReady = allReady && (connectionState[connId].state == "READY_ACCEPTOR")
        }
    });

    displayCurrentPeers(id, connectionState);

    return allReady;
}

function processInitiator(partyName, conn) {
    var state = getState(conn);

    switch( state ) {
        case undefined:
            if( getPC(conn) == undefined ) {
                createInitiatorPC(partyName, conn);
            }

            break;
        case "WAITING_FOR_ANSWER":
            if( conn.answer == undefined ) {
                break;
            }

            var pc = getPC(conn);
            pc.setRemoteDescription(new RTCSessionDescription(conn.answer), function() {}, logError);
            setState(conn, "WAITING_FOR_ANSWER_CANDIDATES");
            break;
        case "WAITING_FOR_ANSWER_CANDIDATES":
            if( conn.answerCandidates == undefined || conn.answerCandidates.length == 0 ) {
                break;
            }

            addAcceptorCandidates(partyName, conn);
            break;
        case "READY_INITIATOR": break;
    }
}

function createInitiatorPC(partyName, conn) {
    var peerConn = new RTCPeerConnection(configuration);
    setPC( conn, peerConn );

    peerConn.onicecandidate = function(event) {
        if( event.candidate != undefined ) {
            addCandidate(conn, event.candidate);
        } else {
            console.log("cip end of candidates");
            sendOfferCandidate(partyName, conn, getCandidates(conn));
        }
    };

    var dataChannel = peerConn.createDataChannel(getId(conn));
    setDC(conn, dataChannel);
    dataChannel.onopen = function() { console.log('CHANNEL opened!!! for ', conn.acceptor); setState(conn, "READY_INITIATOR"); };
    dataChannel.onclose = function() { console.log('Channel closed.'); }
    dataChannel.onmessage = processPeerMessage;

    peerConn.createOffer( function(desc) {
        peerConn.setLocalDescription(desc, function() {
            sendOffer(partyName, conn, peerConn.localDescription);
            setState(conn, "WAITING_FOR_ANSWER");
        }, logError);
    }, logError);
}

function addAcceptorCandidates(partyName, conn) {
    var candidates = conn.answerCandidates;
    candidates.forEach( function(candidate) {
        getPC(conn).addIceCandidate( new RTCIceCandidate(candidate) );
        console.log("cip candidate added", candidate);
    });
}

function processAcceptor(partyName, conn) {
    var state = getState(conn);

    switch( state ) {
        case undefined:
        case "WAITING_FOR_OFFER":
            if( conn.offer == undefined ) {
                setState(conn, "WAITING_FOR_OFFER");
                break;
            }

            if( conn.answer == undefined ) {
                createAcceptorAnswer(partyName, conn);
                break;
            }

            break;
        case "WAITING_FOR_OFFER_CANDIDATES":
            if( conn.offerCandidates == undefined || conn.offerCandidates.length == 0 ) {
                break;
            }

            addInitiatorCandidates(partyName, conn);
            break;
        case "READY_ACCEPTOR": break;
    }
}

function createAcceptorAnswer(partyName, conn) {
    var peerConn = new RTCPeerConnection(configuration);
    setPC( conn, peerConn );

    peerConn.onicecandidate = function(event) {
        if( event.candidate != undefined ) {
            addCandidate(conn, event.candidate);
        } else {
            console.log("caa end of candidates");
            sendAnswerCandidate(partyName, conn, getCandidates(conn) );
        }
    };

    peerConn.ondatachannel = function(event) {
        dataChannel = event.channel;
        setDC(conn, dataChannel);

        dataChannel.onopen = function() { console.log('caa CHANNEL opened!!! for ', conn.initiator); setState(conn, "READY_ACCEPTOR"); };
        dataChannel.onclose = function() { console.log('caa Channel closed.'); }
        dataChannel.onmessage = processPeerMessage;
    };

    var offerMsg = conn.offer;
    peerConn.setRemoteDescription(new RTCSessionDescription(offerMsg), function() {}, logError);
    peerConn.createAnswer( function(desc) {
        peerConn.setLocalDescription(desc, function() {
            sendAnswer(partyName, conn, peerConn.localDescription);
            setState(conn, "WAITING_FOR_OFFER_CANDIDATES");
        }, logError);
    }, logError);
}

function addInitiatorCandidates(partyName, conn) {
    var candidates = conn.offerCandidates;
    candidates.forEach( function(candidate) {
        getPC(conn).addIceCandidate( new RTCIceCandidate(candidate) );
    });
}

function getCandidates(conn) {
    return connectionState[getId(conn)].candidates;
}

function addCandidate(conn, candidate) {
    if( connectionState[getId(conn)].candidates == undefined ) {
        connectionState[getId(conn)].candidates = [];
    }

    connectionState[getId(conn)].candidates.push(candidate);
}

function getDC(conn) {
    return connectionState[getId(conn)].dc;
}

function setDC(conn, dc) {
    connectionState[getId(conn)].dc = dc;
}

function getPC(conn) {
    return connectionState[getId(conn)].pc;
}

function setPC(conn, pc) {
    connectionState[getId(conn)].pc = pc;
}

function getState(conn) {
    return connectionState[getId(conn)].state;
}

function setState(conn, state) {
    connectionState[getId(conn)].state = state;
}

function getId(conn) {
    return conn.initiator + ">" + conn.acceptor;
}

function logError(err) {
    if (!err) return;
    if (typeof err === 'string') {
        console.warn(err);
    } else {
        console.warn(err.toString(), err);
    }
}