# Espy's Gallery Grid
[Web Page](https://espy.world/gallery-grid)

This is a widget designed for the indie web to easily display a gallery! 
It is designed to be both simple to use and fully customizable, with or without javascript knowledge! 

## Features
- Fixed grids and justified grids!
- Flexible, suitable for both a full gallery or a simple set of images
- Titles and descriptions
- Mobile friendly, and supports swipe controls
- Supports GIFs and transparent images
- Options for scaling and pixelated rendering for pixel art
- Comes with a lightbox/image viewer (with keyboard shortcuts)
- Pagination support
- Sorts and filters support
- Thumbnailing
- Captions
- Fully customizable with CSS
- And supports dynamic changes with javascript!

## How to Install

[Download Latest Version](https://github.com/espimyte/gallery-grid/releases/download/v1.0.0/gallery-grid.zip)

Additional premade themes are available through the [web page](https://espy.world/gallery-grid) or [latest release](https://github.com/espimyte/gallery-grid/releases/tag/v1.0.0).

Once downloaded, extract the `.zip` file.

It should contain two files named `gallery-grid.js` and `gallery-grid.css`. Put them anywhere on your site.

At the top of `gallery-grid.js`, there will be a variable called `stylePath`. Set that to the path of where `gallery-grid.css` is on your site. 

## How to Use

1. On any page that you want to use the gallery grid, add the following to the bottom of the body, or anywhere that is below where you are going to add the grid.

```html
<script src="/gallery-grid.js"></script>
```

Note: Make sure to replace the source with the path to where you host the file on your site!

2. Add `<gallery-grid></gallery-grid>` where you want the grid to be.

3. Fill it with images!
```html
<gallery-grid>
  <img src="/image-1.png" />
  <img src="/image-2.jpg" />
  <img src="/image-3.gif" />
</gallery-grid>
```

If all you need is a simple grid, you can stop right here!

For more details instructions on how to use more features of the widget, see the [web page](https://espy.world/gallery-grid).

## Terms of Use
Do NOT remove the header comments in either the CSS or JavaScript files!

You are still free to edit these files as much as you like. As long as the credit inside of the header is intact, there's no problem.

Thank you for reading, and I hope you find this resource is helpful!
