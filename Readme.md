# 3D Browser Rendering
This project was inspired by [Javidx9](https://www.youtube.com/c/javidx9)'s "[Code-It-Yourself!](https://www.youtube.com/playlist?list=PLrOv9FMX8xJE8NgepZR1etrsU63fDDGxO)" series.
The project is based of off the [3D Graphics Engine](https://youtu.be/ih20l3pJoeU) set of videos.

The project uses HTML5's 2d [`<canvas>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas) context in the same way [olPixelGameEngine](https://github.com/OneLoneCoder/olcPixelGameEngine) created by [OneLoneCoder](https://github.com/OneLoneCoder) is used.
```js
const canvas = document.querySelector('canvas');

const ctx = canvas.getContext('2d');`
```
The `ctx` variable is used to draw to the screen using methods like `stroke()` & `fill()` to draw lines and faces respectively

**_Extra notes_**

**_Problems_**
(None at the moment)
