import './App.css';
import React, { useState, useRef } from 'react';
import CanvasDraw from 'react-canvas-draw';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Slide from '@material-ui/core/Slide';
import error from './error.png';
import CardMedia from '@material-ui/core/CardMedia';

const testVideo = 'https://pixelpopart-1764327015.appspot.com/file/d8401c23-c763-44fb-a58b-261f45cf860e.mp4';
const timeout = 500;

// TODO: these suck, but for some reason the css class to the button groups 
// do not apply the proper styles, would be good to investigate
const leftStyle = {
  border: '2px solid',
  borderTopLeftRadius: '25px',
  borderBottomLeftRadius: '25px',
  background: 'white'
};
const rightStyle = {
  border: '2px solid',
  borderTopRightRadius: '25px',
  borderBottomRightRadius: '25px',
  background: 'white'
};
const centerStyle = {
  border: '2px solid',
  background: 'white'
};

/**
 * Convert base64 canvas export of an image to a file object.
 * Used to upload canvas selection as a file.
 * @param {string} base64 base64 string data of a png image
 * @param {string} mime mime-type for the image like img/png
 */
const base64ToBlob = (base64, mime) => {
  mime = mime || '';
  var sliceSize = 1024;
  var byteChars = window.atob(base64);
  var byteArrays = [];

  for (var offset = 0, len = byteChars.length; offset < len; offset += sliceSize) {
    var slice = byteChars.slice(offset, offset + sliceSize);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, {type: mime});
}

const BackgroundVideo = (props) => {
  return (
    <div>
      <CardMedia
        component='video'
        image={props.src}
        autoPlay controls preload="auto"
      />
      <div>
        <ButtonGroup disableElevation={true} variant="contained" className='buttons'>
          <Button style={leftStyle} onClick={() => props.reset()}>Again</Button>
          <Button component="a" href={props.src} download="download.mp4" style={rightStyle}>Download</Button>
        </ButtonGroup>
      </div>
    </div>
  )
};

const Canvas = (props) => {
  const canvasRef = useRef(null);

  const handleUploadImage = async (blob) => {
    const data = new FormData();
    const url = `${process.env.REACT_APP_FUNCTIONS_URL}`;
    data.append('data', blob);
  
    fetch(url, {
      method: 'POST',
      body: data,
    }).then((response) => {
        if (!response.ok) {
          console.error(response);
          props.onError();
        } else {
          response.json().then((body) => {
            const videoSrc = `${process.env.REACT_APP_CDN_URL}/file/${body.filename}`;
            props.onSuccess(videoSrc);
          });
        }
    }).catch((error) => {
      console.error(error);
      props.onError();
    });
  };

  const handleExport = () => {
    const b64imageData = canvasRef.current.getSaveData('png').split('base64,')[1];
    const imageBlob = base64ToBlob(b64imageData, 'image/png');
    handleUploadImage(imageBlob);
    props.onLoad();
  };

  // Hacky way to handle canvas sizing on small windows
  const height = window.innerHeight > 600 ? 512 : 256;
  const width = window.innerWidth > 600 ? 512 : 256;

  return (
    <div>
      <p>Draw an outline on the canvas below to create your own terrible pocket monster.</p>
      <div className={'canvas'} id={'canvas'}>
        <CanvasDraw
          brushRadius={2}
          brushColor={'#000'}
          ref={canvasDraw => (canvasRef.current = canvasDraw)}
          hideGrid={true}
          canvasWidth={width}
          canvasHeight={height}
          lazyRadius={0}
          hideInterface={true}
          className={'canvas_container'}
        >
        </CanvasDraw>
      </div>
      <ButtonGroup disableElevation={true} variant="contained" className='buttons'>
        <Button style={leftStyle} onClick={handleExport}>Create</Button>
        <Button style={centerStyle} onClick={() => canvasRef.current.clear()}>Clear</Button>
        <Button style={rightStyle} onClick={() => canvasRef.current.undo()}>Undo</Button>
      </ButtonGroup>
    </div>
  )
};

const Loading = (props) => {
  const [classes, setClasses] = useState('pokeball');
  setTimeout(() => setClasses('pokeball pokeball__shake'), timeout);

  return (
    <div class={classes}>
      <div class="pokeball__button"/>
    </div>
  )
};

const Error = (props) => {
  return (
    <div>
      <p>Uh Oh! We ran into a problem, would you care to try again?</p>
      <img src={error} alt="Error"/>
      <ButtonGroup disableElevation={true} variant="contained" className='buttons'>
        <Button style={{...leftStyle, ...rightStyle}} onClick={() => props.reset()}>Try Again</Button>
      </ButtonGroup>
    </div>
  )
}

const App = () => {
  const [page, setPage] = useState('drawing');
  const [videoSource, setVideoSource] = useState(testVideo);
  const [direction, setDirection] = useState('left');
  const [enter, setEnter] = useState(true);

  /**
   * Set main page component and handle slide transitions from left to right
   * @param  {String} pageItem  name of the component to switch to
   */
  const setPageItem = (pageItem) => {
    setEnter(false);
    setDirection('right');
    setTimeout(() => {
      setEnter(true);
      setDirection('left');
      setPage(pageItem);
    }, timeout)
  };

  const showError = () => setPageItem('error');
  const showDrawing = () => setPageItem('drawing');
  const showLoading = () => setPageItem('loading');
  const showVideo = (videoSrc = testVideo) => {
    setVideoSource(videoSrc);
    setPageItem('playing');
  };

  const components = {
    drawing: <Canvas onSuccess={showVideo} onLoad={showLoading} onError={showError}/>,
    loading: <Loading/>,
    playing: <BackgroundVideo src={videoSource} reset={showDrawing}/>,
    error: <Error reset={showDrawing}/>
  };

  return (
    <div key={page}>
      <Slide direction={direction} in={enter} timeout={timeout}>
        <div>
          {components[page]}
        </div>
      </Slide>
    </div>
  );
}

export default App;
