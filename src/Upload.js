import React, { useState, useEffect, useRef } from 'react';
import Crypto from 'crypto';
import Uuid from 'node-uuid';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';


function FileUploader ({onFileSelect}) {
    const fileInput = useRef(null)

    const handleFileInput = (e) => {
        // handle validations
        onFileSelect(e.target.files[0])
    }

    return (
        <div className="file-uploader">
            <input type="file" onChange={handleFileInput}/>
        </div>
    )
};

export default function Upload() {

  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState();

  function generateHeaders() {
    var requestId = Uuid.v1();
    var clientKey = process.env.REACT_APP_CLIENT_KEY;
    var hash = Crypto.createHmac('sha256', clientKey).update(requestId).digest('base64');
    var headers = {
      'X-Request-ID': requestId,
      'X-Request-Signature': hash,
    }
    return headers
  };

  function handleUploadImage(ev) {
    ev.preventDefault();

    const data = new FormData();
    data.append('image', file);
    let url = `http://localhost:8080`;
    // let headers = generateHeaders();

    fetch(url, {
      method: 'POST',
      body: data,
    //   headers: headers,
    }).then((response) => {
        if (!response.ok) {
            console.log(response);
        }
        response.json().then((body) => {
            setImageUrl(`http://localhost:8081/image/${body.filename}`);
          });
    });
  };

  return (
    <div>
    <Form onSubmit={handleUploadImage} onReset={() => setImageUrl('')}>
    <FileUploader onFileSelect={(file) => {setFile(file)}} />
    <Button variant="primary" type="submit">
        Submit
    </Button>
    <Button variant="primary" type="reset">
        Clear
    </Button>
    </Form>
    <Image src={imageUrl} hidden={imageUrl === ''} />
    </div>
  )};
