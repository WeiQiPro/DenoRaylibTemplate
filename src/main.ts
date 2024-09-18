import * as RL from "raylib";

let screenWidth: number = 200;
let screenHeight: number = 200;

let bg = [0, 0, 0, 255]
let bgColor = new RL.Color(bg[0], bg[1], bg[2], bg[3]);

export function tick() {
    screenWidth = RL.Screen.getWidth();
    screenHeight = RL.Screen.getHeight();

    bg[0] = (bg[0] % 255) + 3
    bg[1] = (bg[1] % 255) + 2
    bg[2] = (bg[2] % 255) + 1

    bgColor = new RL.Color(255, 255, 255, 255)
}



export function draw() {
    RL.Shapes.drawRectangle(0, 0, screenWidth, screenHeight, bgColor)
    RL.Text.drawText("Hello Deno!", screenWidth/2, screenHeight/2, 20, RL.BLACK)
}
