const StarryBackground = () => {
  return (
    <>
      <div className="night"></div>
      <div className="stars"></div>
      <div className="twinkling"></div>

      <style jsx>{`
        @-webkit-keyframes rotate {
          from {
            -webkit-transform: rotate(0deg);
          }
          to {
            -webkit-transform: rotate(360deg);
          }
        }

        @-moz-keyframes rotate {
          from {
            -moz-transform: rotate(0deg);
          }
          to {
            -moz-transform: rotate(360deg);
          }
        }

        @-ms-keyframes rotate {
          from {
            -ms-transform: rotate(0deg);
          }
          to {
            -ms-transform: rotate(360deg);
          }
        }

        @keyframes rotate {
          0% {
            -webkit-transform: rotate(0deg);
          }
          100% {
            -webkit-transform: rotate(360deg);
          }
        }
        .night {
          background-color: black;
          width: 100%;
          height: 100%;
          position: absolute;
          overflow: hidden;
          z-index: -3;
        }

        .stars,
        .twinkling {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        .stars {
          background: black url(images/stars.png) repeat top center;
          z-index: -2;
          -webkit-animation-name: rotate;
          -webkit-animation-duration: 400s;
          -webkit-animation-iteration-count: infinite;
          -webkit-animation-timing-function: linear;
          -moz-animation-name: rotate;
          -moz-animation-duration: 400s;
          -moz-animation-iteration-count: infinite;
          -moz-animation-timing-function: linear;
          -ms-animation-name: rotate;
          -ms-animation-duration: 400s;
          -ms-animation-iteration-count: infinite;
          -ms-animation-timing-function: linear;
          animation: rotate 400s linear infinite;
          -webkit-transform: translate3d(0, 0, 0);
          -moz-transform: translate3d(0, 0, 0);
          -ms-transform: translate3d(0, 0, 0);
          transform: translate3d(0, 0, 0);
        }

        .twinkling {
          background: transparent url(images/twinkling.png) repeat top center;
          z-index: -1;
        }
      `}</style>
    </>
  )
}

export default StarryBackground
