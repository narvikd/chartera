// @ts-ignore
import { useRef, useEffect, useState } from "react";
import { calcTopBody, drawCandle, drawLine, drawPriceLine, getColor, drawTimeLine, drawVolumeCandle } from "./CanvasHelpers"
import { ChartRightMargin, horizontalPriceLines, verticalPriceLines } from "./constants"
type dataObj = {
  low: number,
  high: number,
  open: number,
  close: number,
  openTime: number,
  volume: number
}

interface IProps {
  data: Array<{
    low: number,
    high: number,
    open: number,
    close: number,
    openTime: number,
    volume: number
  }>
}

const Canvas: React.FC<IProps> = (props) => {
  const [data] = useState<Array<dataObj>>(props.data);
  const [candleWidth, setCandleWidth] = useState<number>();

  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas: HTMLCanvasElement = canvasRef.current!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (data && data.length !== 0) {
      setCandleWidth(canvas.width / data.length)
    }
  }, [data, canvasRef])

  useEffect(() => {
    const canvas: HTMLCanvasElement = canvasRef.current!;
    const context: CanvasRenderingContext2D = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;


    let highestVal: number = Math.max(...data.map((o: dataObj) => { return o.high; }));
    let lowestVal: number = Math.min(...data.map((o: dataObj) => { return o.low; }));
    let maxTime: number = Math.max(...data.map((o: dataObj) => { return o.openTime }))
    let minTime: number = Math.min(...data.map((o: dataObj) => { return o.openTime; }));
    let maxVolume: number = Math.max(...data.map((o: dataObj) => { return o.volume; }));
    let minVolume: number = Math.min(...data.map((o: dataObj) => { return o.volume; }));
    /*
    The size of each unit of height 
    To get sized based on   (price1-price2)*heightCubicles
    */
    let heightCubicles: number = context.canvas.height / (highestVal - lowestVal); //cada unidad de precio equivale a unidad * heightcubicles en escala de canvas
    let widthCubciles: number = context.canvas.width / (maxTime - minTime);
    //Fills the whole screen with black
    context.fillStyle = "black";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    //Width is accumulated to distribute the candles horizontally
    let accumulatedWith: number = 0;

    /*Draw horizontal lines*/
    if (data) drawPriceLine(context, highestVal, lowestVal, horizontalPriceLines)


    let candlesToIgnore: number = 0;
    if (candleWidth) candlesToIgnore = ChartRightMargin / candleWidth

    /*Draw timestamp lines*/
    drawTimeLine(context, maxTime, minTime, verticalPriceLines, candlesToIgnore)

    //Draw the candles
    data && data.length > 0 && data.filter((i, index) => index >= candlesToIgnore).forEach((i: dataObj, index: number) => {

      //Width is accumulated only after the first candle has been drawn
      if (index > 0 && candleWidth) {
        accumulatedWith += candleWidth;
      }
      if (candleWidth) {
        let bodyHeight: number = Math.abs((i.open - i.close) * heightCubicles)
        let tailHeight: number = (i.high - i.low) * heightCubicles
        /*To draw the body of the candle*/
        drawCandle(
          context,
          accumulatedWith,
          calcTopBody(
            data[index - (candlesToIgnore + 1)]?.close,
            i.open,
            i.close,
            heightCubicles,
            highestVal
          ),
          candleWidth,
          bodyHeight,
          getColor(i.open, i.close)
        );

        /*To draw the tail of the candle*/
        let tailMarginLeft: number = accumulatedWith + (candleWidth / 2)
        let tailMarginTop: number = (highestVal - i.high) * heightCubicles
        drawLine(context, tailMarginLeft, tailMarginTop, 1, tailHeight, getColor(i.open, i.close));

        /*Draw volume candles*/
        drawVolumeCandle(context, accumulatedWith, i.open, i.close, i.volume, maxVolume, candleWidth, canvas.height)
      }

    })
  }, [candleWidth, data])

  return <canvas ref={canvasRef} {...props} />;
}
export default Canvas;
