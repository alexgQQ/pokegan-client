import './App.css';
import './css/styles/pokemon-gameboy-css.css'
import React, { useState, useEffect, useRef } from 'react';
import CanvasDraw from 'react-canvas-draw';

const testVideo = 'https://pixelpopart-1764327015.appspot.com/image/3b33d4c4-0fa4-47b5-8bcc-2cb0c046fcd4.mp4';

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
        <div className='framed'>
            {props.hidden === false &&
                <video autoPlay="autoplay" controls preload="auto">
                    <source src={props.src} height='720' width='1280' type="video/mp4" />
                </video>
            }
        </div>
    )
};

function Canvas(props) {

    const canvasRef = useRef(null);

    const handleUploadImage = async (blob) => {

        const data = new FormData();
        const url = `${process.env.REACT_APP_FUNCTIONS_URL}`;
        data.append('image', blob);
    
        fetch(url, {
          method: 'POST',
          body: data,
        }).then((response) => {
            response.json().then((body) => {
                props.sourceSetter(`${process.env.REACT_APP_CDN_URL}/image/${body.filename}`);
                props.setPage('playing');
            });
        });
    };

    const handleExport = () => {
        const b64imageData = canvasRef.current.getSaveData('png').split('base64,')[1];
        const imageBlob = base64ToBlob(b64imageData, 'image/png');
        handleUploadImage(imageBlob);
        props.setPage('loading');
    };

    return (
        <div className={'framed main'}>
            <CanvasDraw
                brushRadius={1}
                brushColor={'#000'}
                ref={canvasDraw => (canvasRef.current = canvasDraw)}
                hideGrid={true}
                canvasWidth={256}
                canvasHeight={256}
            >
            </CanvasDraw>
                <ul className="framed no-hd buttons compact">
                    <li><button type={'input'} onClick={handleExport}> Create </button></li>
                    <li><button type={'input'} onClick={() => canvasRef.current.clear()}> Clear </button></li>
                    <li><button type={'input'} onClick={() => canvasRef.current.undo()}> Undo </button></li>
                </ul>
        </div>
    )
}

const Loading = (props) => {
  const [percent, setPercent] = useState(0);

  if (percent > 100) {
    setPercent(100);
  }

  useEffect(() => {
    const intervalID = setInterval(() => setPercent(percent + 1), props.loadingTime / 100);
    return () => clearInterval(intervalID);
  }, [percent]);

  return (
    <div className='stats loading framed'>
      <h2>Creating pokemon ... </h2>
      <div className='options'>
        <label for='progressBar'></label>
        <div className={`progress-bar p${percent}`} id='progressBar'></div>
      </div>
    </div>
  )
};


function App() {

  const [page, setPage] = useState('drawing');
  const [videoSource, setVideoSource] = useState(testVideo);


  return (
    <div className='wrapper'>
      <div className='framed header'>
        <h1 >PokeGAN</h1>
        <p>Create your own terrible pocket monster.</p>
      </div>

      {
        {
          drawing: <Canvas sourceSetter={setVideoSource} setPage={setPage}></Canvas>,
          loading: <Loading loadingTime={30000}></Loading>,
          playing: <BackgroundVideo src={videoSource} hidden={false}></BackgroundVideo>,
        }[page]
      }
    </div>
  );
}

export default App;
