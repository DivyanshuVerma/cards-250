var offerAPITemplate = "/party/{partyName}/peer/{initiator}/offer/{acceptor}";
var answerAPITemplate = "/party/{partyName}/peer/{acceptor}/answer/{initiator}";
var offerCandidateAPITemplate = "/party/{partyName}/peer/{initiator}/offerCandidate/{acceptor}";
var answerCandidateAPITemplate = "/party/{partyName}/peer/{acceptor}/answerCandidate/{initiator}";

function sendOffer(partyName, conn, offerData) {
    $.ajax({
        url: getOfferAPI(partyName, conn),
        type: "POST",
        data: JSON.stringify(offerData.toJSON()),
        contentType: "application/json; charset=UTF-8",
        success: function(data) {
            console.log("offer call result: ", data);
        },
        error: logError
    });
}

function sendAnswer(partyName, conn, answerData) {
    $.ajax({
        url: getAnswerAPI(partyName, conn),
        type: "POST",
        data: JSON.stringify(answerData.toJSON()),
        contentType: "application/json; charset=UTF-8",
        success: function(data) {
            console.log("answer call result: ", data);
        },
        error: logError
    });
}

function sendOfferCandidate(partyName, conn, candidate) {
    $.ajax({
        url: getOfferCandidateAPI(partyName, conn),
        type: "POST",
        data: JSON.stringify(candidate),
        contentType: "application/json; charset=UTF-8",
        success: function(data) {
            console.log("offer candidate call result: ", data);
        },
        error: logError
    });
}

function sendAnswerCandidate(partyName, conn, candidate) {
    $.ajax({
        url: getAnswerCandidateAPI(partyName, conn),
        type: "POST",
        data: JSON.stringify(candidate),
        contentType: "application/json; charset=UTF-8",
        success: function(data) {
            console.log("answer candidate call result: ", data);
        },
        error: logError
    });
}

function getOfferAPI(partyName, conn) {
    return replaceInitiatorAcceptor(partyName, conn, offerAPITemplate);
}

function getAnswerAPI(partyName, conn) {
    return replaceInitiatorAcceptor(partyName, conn, answerAPITemplate);
}

function getOfferCandidateAPI(partyName, conn) {
    return replaceInitiatorAcceptor(partyName, conn, offerCandidateAPITemplate);
}

function getAnswerCandidateAPI(partyName, conn) {
    return replaceInitiatorAcceptor(partyName, conn, answerCandidateAPITemplate);
}

function replaceInitiatorAcceptor(partyName, conn, url) {
    return url.replace("{partyName}", partyName).replace("{initiator}", conn.initiator).replace("{acceptor}", conn.acceptor);
}