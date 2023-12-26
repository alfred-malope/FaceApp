document.addEventListener("DOMContentLoaded", function() {
  const video = document.getElementById("video");
  const labelElement = document.getElementById("faceLabel");
  const labelContainer = document.getElementById("labelContainer");

  Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    faceapi.nets.ageGenderNet.loadFromUri("/models"),
  ]).then(startWebcam);

  function startWebcam() {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: false,
      })
      .then((stream) => {
        video.srcObject = stream;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  video.addEventListener("play", () => {
    const existingContainer = document.getElementById('container');
    const canvas = faceapi.createCanvasFromMedia(video);
    existingContainer.appendChild(canvas);

    // Set canvas dimensions to match the video's natural size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions()
        .withAgeAndGender();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

      resizedDetections.forEach((d, index) => {
        const age = Math.round(d.age);
        const ageRange = getAgeRange(age);
        const gender = d.gender;
        const emotion = getDominantExpression(d.expressions);
        const box = d.detection.box;

        const drawBox = new faceapi.draw.DrawBox(box, {
          label: `Age: ${ageRange}, Gender: ${gender}, Emotion: ${emotion}`,
        });
        drawBox.draw(canvas);

        // Update label below the canvas
        labelElement.textContent = `Age: ${ageRange}, Gender: ${gender}, Emotion: ${emotion}`;
        
        // Add line break after each label except the last one
        if (index < resizedDetections.length - 1) {
          labelContainer.appendChild(document.createElement("br"));
        }
      });
    }, 100);
  });

  function getDominantExpression(expressions) {
    return Object.entries(expressions).reduce((prev, curr) =>
      curr[1] > prev[1] ? curr : prev
    )[0];
  }

  function getAgeRange(age) {
    if (age < 18) {
      return "Under 18";
    } else if (age >= 18 && age < 30) {
      return "18-29";
    } else if (age >= 30 && age < 50) {
      return "30-49";
    } else {
      return "50 and above";
    }
  }
});
