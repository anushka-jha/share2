/**
 *
 * VideoCall
 *
 */

import React, { useEffect, useState } from 'react';
import Video from 'twilio-video';
import _ from 'lodash';
import { Button, Container, Col, Row } from 'shards-react';
import PropTypes from 'prop-types';
// import styled from 'styled-components';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import './style.css';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import VideoCallParticipant from '../VideoCallParticipant';
import Spinner from '../Spinner';
import QuestionBox from '../QuestionBox';

const isMobileOperatingSystem = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  if (
    /windows phone/i.test(userAgent) ||
    /android/i.test(userAgent) ||
    (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream)
  ) {
    return true;
  }

  // return false;
  return true;
};

const isMobileOperatingSystemValue = isMobileOperatingSystem();

function VideoCall({
  token,
  identity,
  callData,
  roomName,
  onEndCall,
  initialState,
  onCaptureImage,
  onMuteParticipant,
  onJoinFetchData,
  responses,
  setResponses,
  showQuestionBox,
}) {
  let activeRoom;
  const [loading, setLoading] = useState(true);
  const [localParticipant, setLocalParticipant] = useState(null);
  const [cameraSwitchLoading, setCameraSwitchLoading] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const [spotlightedParticipant, setSpotlightedParticipant] = useState(null);
  const [emailToNameMapper, setEmailToNameMapper] = useState({});
  const [paneOpen, setPaneOpen] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(
    initialState.micStatus || false,
  );
  const [isVideoEnabled, setIsVideoEnabled] = useState(
    initialState.videoStatus || false,
  );
  const [facingModeValue, setFacingModeValue] = useState(
    initialState.facingMode || 'user',
  );
  const [zoomInMap, setZoomInMap] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  useEffect(() => {
    onJoinFetchData();
  }, []);

  useEffect(() => {
    if (spotlightedParticipant) {
      spotlightedParticipant.videoTracks.forEach(publication => {
        if (publication) {
          const div = document.getElementById('byomkesh-video-call-spotlight');
          div.innerHTML = '';
          div.appendChild(publication.track.attach());
        }
      });
    }
  }, [spotlightedParticipant]);

  useEffect(() => {
    setupEmailToNameMapper();
    setLocalParticipant(null);

    const participantConnected = participant => {
      setRemoteParticipants(prevParticipants => [
        ...prevParticipants,
        participant,
      ]);
    };
    const participantDisconnected = participant => {
      setRemoteParticipants(prevParticipants =>
        prevParticipants.filter(p => p !== participant),
      );
    };

    try {
      Video.connect(token, {
        name: roomName,
        audio: true,
        video: { facingMode: facingModeValue },
        dominantSpeaker: true,
      }).then(room => {
        console.log('Connected to Room "%s"', room.name);
        activeRoom = room;
        room.on('dominantSpeakerChanged', participant => {
          console.log('The new dominant speaker in the Room is:', participant);
        });
        setLocalParticipant(room.localParticipant);
        setRemoteParticipants(room.participants);
        room.participants.forEach(participantConnected);
        room.on('participantConnected', participantConnected);
        room.on('participantDisconnected', participantDisconnected);
        room.once('disconnected', () =>
          room.participants.forEach(participantDisconnected),
        );
        if (room.localParticipant) {
          if (!isAudioEnabled) {
            onMuteParticipant(room.localParticipant.identity, 'audio', true);
          }
          if (!isVideoEnabled) {
            onMuteParticipant(room.localParticipant.identity, 'video', true);
          }
        }
        setLoading(false);
        setCameraSwitchLoading(false);
      });
      return () => {
        activeRoom.disconnect();
      };
    } catch (err) {
      console.log(err);
    }
  }, [facingModeValue]);

  const cameraSwitch = () => {
    setLoading(true);
    setCameraSwitchLoading(true);
    if (facingModeValue === 'environment') setFacingModeValue('user');
    else if (facingModeValue === 'user') setFacingModeValue('environment');
  };

  const captureImage = () => {
    const canvas = document.createElement('canvas');
    const video = document.querySelector(
      '#byomkesh-video-call-spotlight video',
    );

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas
      .getContext('2d')
      .drawImage(video, 0, 0, video.videoWidth, video.videoHeight); // for drawing the video element on the canvas

    canvas.toBlob(blob => {
      onCaptureImage(blob, `image_${Date.now()}`);
    });
  };

  const setupEmailToNameMapper = () => {
    const newEmailToNameMapper = {
      ...emailToNameMapper,
    };

    setEmailToNameMapper(newEmailToNameMapper);
  };

  const BootstrapTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
      color: theme.palette.common.black,
    },
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.black,
      maxWidth: 200,
      textAlign: 'center',
    },
  }));

  return (
    <Container className="w-100 byomkesh-video-call-background py-0 pl-3 pr-3">
      {!loading ? (
        <Row className="byomkesh-video-call-background-row">
          <Col
            className={
              isMobileOperatingSystemValue
                ? 'byomkesh-video-call-background-col-mobile'
                : paneOpen
                ? 'byomkesh-video-call-background-col-openPane'
                : 'byomkesh-video-call-background-col-closedPane'
            }
          >
            <Row className="w-100 m-0 p-0">
              {spotlightedParticipant &&
                (spotlightedParticipant.identity === localParticipant.identity
                  ? isVideoEnabled
                  : true) && (
                  <div
                    className={
                      fullScreen
                        ? 'byomkesh-video-call-spotlight-div full-screen'
                        : 'byomkesh-video-call-spotlight-div'
                    }
                  >
                    <div
                      style={
                        zoomInMap
                          ? { cursor: 'zoom-out' }
                          : { cursor: 'zoom-in' }
                      }
                      id="byomkesh-video-call-spotlight"
                      className={
                        zoomInMap
                          ? 'byomkesh-video-call-spotlight-class-cover col-12 mt-2'
                          : 'byomkesh-video-call-spotlight-class-contain col-12 mt-2'
                      }
                      onClick={() => {
                        setZoomInMap(!zoomInMap);
                      }}
                    />
                    <div className="d-flex byomkesh-video-call-spotlight-controls">
                      <div className="video-call-spotlight-controls-panel">
                        <BootstrapTooltip
                          title="Capture Screen"
                          placement="top"
                        >
                          <div className="mr-3">
                            {!isMobileOperatingSystemValue && (
                              <Button
                                size="sm"
                                className="capture-button "
                                theme="primary"
                                onClick={() => captureImage()}
                              >
                                <CameraAltIcon className="zoom-map-icons" />
                              </Button>
                            )}
                          </div>
                        </BootstrapTooltip>
                        <BootstrapTooltip
                          title={
                            !fullScreen
                              ? 'Full Screen Mode'
                              : 'Minimize Full Screen'
                          }
                          placement="top"
                        >
                          <div className="mr-3">
                            <Button
                              size="sm"
                              className=""
                              theme="primary"
                              onClick={() => {
                                setFullScreen(!fullScreen);
                              }}
                            >
                              {fullScreen ? (
                                <FullscreenExitIcon className="zoom-map-icons" />
                              ) : (
                                <FullscreenIcon className="zoom-map-icons" />
                              )}
                            </Button>
                          </div>
                        </BootstrapTooltip>
                        <BootstrapTooltip
                          title="Close Spotlight"
                          placement="top"
                        >
                          <div>
                            <Button
                              size="sm"
                              className=""
                              theme="danger"
                              onClick={() => {
                                setSpotlightedParticipant(null);
                                setFullScreen(false);
                              }}
                            >
                              <CancelPresentationIcon className="zoom-map-icons" />
                            </Button>
                          </div>
                        </BootstrapTooltip>
                      </div>
                    </div>
                  </div>
                )}

              {!fullScreen && (
                <Col className="all-participants" lg={12}>
                  <div
                    className={
                      spotlightedParticipant
                        ? 'participant-individual-spotlight'
                        : 'participant-individual'
                    }
                  >
                    {localParticipant && (
                      <VideoCallParticipant
                        displayName="You"
                        participant={localParticipant}
                        onSpotlightClicked={() =>
                          setSpotlightedParticipant(localParticipant)
                        }
                        spotlightScreenSelected={spotlightedParticipant}
                        isLocalParticipant
                        tracks={{
                          micStatus: isAudioEnabled,
                          videoStatus: isVideoEnabled,
                        }}
                        onSpotLightCancel={() => {
                          setSpotlightedParticipant(null);
                        }}
                      />
                    )}
                  </div>
                  {remoteParticipants.length > 0 &&
                    remoteParticipants
                      .filter(participant => !!participant.identity)
                      .map(participant => (
                        <div
                          className={
                            spotlightedParticipant
                              ? 'participant-individual-spotlight-or-sharescreen'
                              : 'participant-individual'
                          }
                        >
                          <VideoCallParticipant
                            displayName={participant.identity}
                            key={participant.sid}
                            participant={participant}
                            onSpotlightClicked={() =>
                              setSpotlightedParticipant(participant)
                            }
                            spotlightScreenSelected={spotlightedParticipant}
                            isLocalParticipant={false}
                            tracks={{
                              micStatus: isAudioEnabled,
                              videoStatus: isVideoEnabled,
                            }}
                            onSpotLightCancel={() => {
                              setSpotlightedParticipant(null);
                            }}
                          />
                        </div>
                      ))}
                </Col>
              )}
            </Row>
          </Col>

          {!isMobileOperatingSystemValue && (
            <Col className={paneOpen ? 'info-pane' : 'info-pane-closed'}>
              <div
                className="pane-close"
                onClick={() => setPaneOpen(!paneOpen)}
              >
                {paneOpen ? (
                  <ChevronRightIcon className="pane-close-icon" />
                ) : (
                  <ChevronRightIcon className="pane-open-icon" />
                )}
              </div>
              <Row className="p-0">
                <div className="info-component">
                  <h5 className=" info-heading">Info</h5>
                  {callData ? (
                    <div className=" info-content-box">
                      <div className=" info-content">
                        <h6 className="info-content-label">Questions</h6>
                        <p className="info-content-value">
                          {/* {callData.id || '-'} */}
                        </p>
                      </div>
                      {showQuestionBox && (
                        <QuestionBox
                          response={responses}
                          setResponse={setResponses}
                        />
                      )}
                      {/* <div className=" info-content">
                        <h6 className="info-content-label">Claim Number</h6>
                        <p className="info-content-value">
                          {callData.claimNumber || '-'}
                        </p>
                      </div> */}

                      {/* <div className=" info-content">
                        <h6 className="info-content-label">Chassis Number</h6>
                        <p className="info-content-value">
                          {callData.chasisNumber || '-'}
                        </p>
                      </div> */}

                      {callData.carMake && (
                        <div className=" info-content">
                          <h6 className="info-content-label">Car Make</h6>
                          <p className="info-content-value">
                            {callData.carMake || '-'}
                          </p>
                        </div>
                      )}
                      {callData.carModule && (
                        <div className=" info-content">
                          <h6 className="info-content-label">Car Modal</h6>
                          <p className="info-content-value">
                            {callData.carModule || '-'}
                          </p>
                        </div>
                      )}
                      {callData.insuredName && (
                        <div className=" info-content">
                          <h6 className="info-content-label">Insured Name </h6>
                          <p className="info-content-value">
                            {callData.insuredName || '-'}
                          </p>
                        </div>
                      )}

                      {callData.location && (
                        <div className=" info-content">
                          <h6 className="info-content-label">Location</h6>
                          {callData.location.map(location => (
                            <p className="info-content-value">
                              {location || '-'}
                            </p>
                          ))}
                        </div>
                      )}

                      {callData.workshopName && (
                        <div className=" info-content">
                          <h6 className="info-content-label">Workshop Name</h6>
                          {callData.workshopName.map(workshopName => (
                            <p className="info-content-value">
                              {workshopName || '-'}
                            </p>
                          ))}
                        </div>
                      )}

                      {callData.workshopUserId && (
                        <div className=" info-content">
                          <h6 className="info-content-label">
                            Workshop User Id
                          </h6>
                          {callData.workshopUserId.map(workshopUserId => (
                            <p className="info-content-value">
                              {workshopUserId || '-'}
                            </p>
                          ))}
                        </div>
                      )}
                      {callData.media && (
                        <div className=" info-content">
                          <div className="d-flex justify-content-between align-items-center">
                            <h6 className="info-content-label">Media</h6>
                            {callData.media.length > 0 && (
                              <Button
                                className="view-all-button py-1 px-3"
                                size="sm"
                                onClick={() => {
                                  const url = window.location.href;
                                  const splitUrl = url.split('/');
                                  const baseUrl = `${splitUrl[0]}//${
                                    splitUrl[2]
                                  }`;
                                  window.open(
                                    `${baseUrl}/claims-media?claimNumber=${
                                      callData.claimNumber
                                    }&token=mytoken`,
                                    '_blank',
                                  );
                                }}
                              >
                                View All
                              </Button>
                            )}
                          </div>
                          <div className="media-display-component">
                            {callData.media
                              .sort((a, b) => (a.path > b.path ? -1 : 1))
                              .map((item, index) => {
                                if (
                                  (callData.media.length > 4 && index < 3) ||
                                  (callData.media.length <= 4 && index < 4)
                                )
                                  return (
                                    <div className="media-display">
                                      <h6 className="media-title">
                                        {item.path.split('/')[3]}
                                      </h6>
                                      {item.path.substr(item.path.length - 3) ==
                                      'jpg' ? (
                                        <img
                                          className="media-image"
                                          src={item.signed_url}
                                          key={item.path}
                                        />
                                      ) : (
                                        <video
                                          className="media-image"
                                          key={item.path}
                                          controls
                                        >
                                          <source
                                            src={item.signed_url}
                                            key={item.path}
                                            type="video/mp4"
                                          />
                                        </video>
                                      )}
                                    </div>
                                  );
                              })}
                            {callData.media.length == 0 ? (
                              <div>Take screenshots to display here.</div>
                            ) : (
                              callData.media.length > 4 && (
                                <Button
                                  className="more-images"
                                  theme="link"
                                  onClick={() => {
                                    const url = window.location.href;
                                    const splitUrl = url.split('/');
                                    const baseUrl = `${splitUrl[0]}//${
                                      splitUrl[2]
                                    }`;
                                    window.open(
                                      `${baseUrl}/claims-media?claimNumber=${
                                        callData.claimNumber
                                      }&token=mytoken`,
                                      '_blank',
                                    );
                                  }}
                                >
                                  <p className="more-images-number">
                                    +{callData.media.length - 3}
                                  </p>
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="p-3">No data to show!</p>
                  )}
                </div>
              </Row>
              <Row className="control-options">
                <Col
                  className={
                    spotlightedParticipant
                      ? 'control-options-capture p-0'
                      : 'control-options-capture p-0 disabled-capture'
                  }
                >
                  <BootstrapTooltip
                    title={
                      spotlightedParticipant
                        ? 'Capture Screen'
                        : 'Use spotlight to Capture Screen'
                    }
                    placement="top"
                  >
                    <div>
                      <Button
                        size="sm"
                        onClick={() => captureImage()}
                        squared
                        className="w-100 px-0 py-2 "
                        theme="link"
                        disabled={!spotlightedParticipant}
                      >
                        <CameraAltIcon className="control-icons" />
                      </Button>
                    </div>
                  </BootstrapTooltip>
                </Col>
                <Col className="control-options-mic p-0">
                  <BootstrapTooltip
                    title={isAudioEnabled ? 'Mute Mic' : 'Unmute Mic'}
                    placement="top"
                  >
                    <div>
                      <Button
                        onClick={() => {
                          onMuteParticipant(
                            localParticipant.identity,
                            'audio',
                            isAudioEnabled,
                          );
                          setIsAudioEnabled(!isAudioEnabled);
                        }}
                        className="w-100 px-0 py-2"
                        squared
                        theme="link"
                      >
                        {isAudioEnabled ? (
                          <MicIcon className="control-icons" />
                        ) : (
                          <MicOffIcon className="control-icons" />
                        )}
                      </Button>
                    </div>
                  </BootstrapTooltip>
                </Col>

                <Col className="control-options-video p-0">
                  <BootstrapTooltip
                    title={isVideoEnabled ? 'Disable Video' : 'Enable Video'}
                    placement="top"
                  >
                    <div>
                      <Button
                        onClick={() => {
                          if (
                            spotlightedParticipant &&
                            spotlightedParticipant.identity ==
                              localParticipant.identity
                          )
                            setSpotlightedParticipant(null);
                          onMuteParticipant(
                            localParticipant.identity,
                            'video',
                            isVideoEnabled,
                          );
                          setIsVideoEnabled(!isVideoEnabled);
                        }}
                        className="w-100 px-0 py-2"
                        squared
                        theme="link"
                      >
                        {isVideoEnabled ? (
                          <VideocamIcon className="control-icons" />
                        ) : (
                          <VideocamOffIcon className="control-icons" />
                        )}
                      </Button>
                    </div>
                  </BootstrapTooltip>
                </Col>

                <Col className="control-options-endcall p-0">
                  <BootstrapTooltip title="End Call" placement="top">
                    <div>
                      <Button
                        className="w-100 px-0 py-2"
                        squared
                        theme="link"
                        onClick={() => {
                          onEndCall();
                        }}
                      >
                        <CallEndIcon className="control-icons" />
                      </Button>
                    </div>
                  </BootstrapTooltip>
                </Col>
              </Row>
            </Col>
          )}

          {isMobileOperatingSystemValue && (
            <Col className="mobile-controls">
              <Row className="mobile-control-options">
                <Col className="mobile-control-options-mic">
                  <Button
                    onClick={() => {
                      onMuteParticipant(
                        localParticipant.identity,
                        'audio',
                        isAudioEnabled,
                      );
                      setIsAudioEnabled(!isAudioEnabled);
                    }}
                    className="w-100 px-0 py-2"
                    squared
                    theme="link"
                  >
                    {isAudioEnabled ? (
                      <MicIcon className="control-icons" />
                    ) : (
                      <MicOffIcon className="control-icons" />
                    )}
                  </Button>
                </Col>
                <Col className="mobile-control-options-video">
                  <Button
                    onClick={() => {
                      onMuteParticipant(
                        localParticipant.identity,
                        'video',
                        isVideoEnabled,
                      );
                      setIsVideoEnabled(!isVideoEnabled);
                    }}
                    className="w-100 px-0 py-2"
                    squared
                    theme="link"
                  >
                    {isVideoEnabled ? (
                      <VideocamIcon className="control-icons" />
                    ) : (
                      <VideocamOffIcon className="control-icons" />
                    )}
                  </Button>
                </Col>

                <Col className="mobile-control-options-share">
                  <Button
                    className="w-100 px-0 py-2"
                    squared
                    theme="link"
                    onClick={cameraSwitch}
                  >
                    <CameraswitchIcon className="control-icons" />
                  </Button>
                </Col>

                <Col className="mobile-control-options-endcall">
                  <Button
                    className="w-100 px-0 py-2"
                    squared
                    theme="link"
                    onClick={() => {
                      onEndCall();
                    }}
                  >
                    <CallEndIcon className="control-icons" />
                  </Button>
                </Col>
              </Row>
            </Col>
          )}
        </Row>
      ) : (
        <Row className="loading-screen">
          <Spinner
            primaryColor="#007bff"
            secondaryColor="white"
            loadingText={
              cameraSwitchLoading ? 'Switching Camera' : 'Connecting...'
            }
            loadingTextFontSize="16px"
            loadingTextColor="black"
          />
        </Row>
      )}
    </Container>
  );
}

VideoCall.propTypes = {
  token: PropTypes.string.isRequired,
  identity: PropTypes.string.isRequired,
  callData: PropTypes.object,
  roomName: PropTypes.string.isRequired,
  onEndCall: PropTypes.func.isRequired,
  initialState: PropTypes.object.isRequired,
  onCaptureImage: PropTypes.func.isRequired,
  onMuteParticipant: PropTypes.func.isRequired,
  onJoinFetchData: PropTypes.func.isRequired,
  responses: PropTypes.object,
  setResponses: PropTypes.func,
  showQuestionBox: PropTypes.bool.isRequired,
};

export default VideoCall;
