var offerAPITemplate = "/party/{partyName}/peer/{initiator}/offer/{acceptor}";
var answerAPITemplate = "/party/{partyName}/peer/{acceptor}/answer/{initiator}";
var offerCandidateAPITemplate = "/party/{partyName}/peer/{initiator}/offerCandidate/{acceptor}";
var answerCandidateAPITemplate = "/party/{partyName}/peer/{acceptor}/answerCandidate/{initiator}";

function sendOffer(partyName, conn, offerData) {
    post_request( getOfferAPI(partyName, conn), JSON.stringify(offerData.toJSON()), function(data) {
        console.log("offer call result: ", data);
    });
}

function sendAnswer(partyName, conn, answerData) {
    post_request( getAnswerAPI(partyName, conn), JSON.stringify(answerData.toJSON()), function(data) {
        console.log("answer call result: ", data);
    });
}

function sendOfferCandidate(partyName, conn, candidate) {
    post_request( getOfferCandidateAPI(partyName, conn), JSON.stringify(candidate), function(data) {
        console.log("offer candidate call result: ", data);
    });
}

function sendAnswerCandidate(partyName, conn, candidate) {
    post_request( getAnswerCandidateAPI(partyName, conn), JSON.stringify(candidate), function(data) {
        console.log("answer candidate call result: ", data);
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