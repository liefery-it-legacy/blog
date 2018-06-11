---
layout: post
title: "Overriding styles in CSS Modules: code smell, or limitation?"
date: 2018-05-07
author: Ali Churcher
tags: CSS-modules, CSS, React, JavaScript
---

CSS modules are a clever build step that allows you to write CSS in a clean manageable way.
No longer do you have gigantic css files. 
No longer are you scared to delete css rules, for fear of unexpected style changes in murky corners of your application. No longer do you have extremely long css rules with multiple classes, divs, or the dreaded `!important` declarations.

With CSS-Modules you can write small and simple CSS files. Each module is its own scope, allowing you to define for example, a `.button` class in several different modules. You Build tools, such as `css-loader` takes care of scoping and naming issues during compilation. CSS modules let you forget about complex naming systems and, for the most part, specificity.


But one day I found myself longing for my old friend specificity. I set out to find out if my longing was a code smell, a limitation of CSS Modules, or something else.

## The goal

Let’s say we have a reusable menu component that is used on every page of the application. It looks like this:

![menu with separators between items](/images/posts/overriding-styles-in-CSS-modules/menu-separated.png){:width="36px"}

The component has an outer div, containing 3 menu items, each with the class `item`
```jsx
//menu.js
import { item } from '..Menu.css'
...

<div className={menu}>
  <button className={item}>HOME</button>
  <button className={item}>STORE</button>
  <button className={item}>CONTACT</button>
</div>
```
Applied to the class `item` we use a pseudo selector `::after` to add the vertical separator after the menu items.
```css
/* menu.css */
.container {
  height: 100%
}

.item::after {
  content: '|';
}
```
All simple enough. But we have a special case for our Menu. When rendered from the header we want to remove the separator lines so that it looks like this:
 
![menu with no separators between items](/images/posts/overriding-styles-in-CSS-modules/menu-not-separated.png)

I want to add some CSS that is used only on Menu's that are inside the Header. The CSS will remove the separator and replace it with empty content:
```CSS
/* replaces the separator with nothing */
.item::after {
  content: ' ';
}
```
You may start to see how specificity comes into all of this.
How can I allow the header to override the styles declared in the menu
##### can the parent component alter styles of the child component?

Well, the basic principles of CSS tell me that if I want my rule to be picked up then it needs to be more specific than the other rules with the same name. If I simply make a new rule, that is more specific of course it will be used!  ...right?

```css
/* menu.css */
.root {
  height: 100%
}

.item::after {
  content: '|';
}
```
```css
/* header.css
wins specificity battle */
.menu.item::after {
  content: '|';
}
```
Header `.menu.item` is much more specific than the `.item` we have defined in the menu component. But does it work?
![menu with separators between items](/images/posts/overriding-styles-in-CSS-modules/menu-separated.png)
 No.
We still have separators. Our more specific css is not being used.

#### Good!
This is how things should be. All the glory of CSS-Modules comes from it’s amazing ability to scope your CSS classes uniquely. The reason you are allowed to define a `.button` class in several components is because these classes, once compiled are given scoped names with a unique hash. If we use our developer tools we can see this happening in action with our `.item` class:
![compiled menu scoped classes](/images/posts/overriding-styles-in-CSS-modules/compiled-menu-classes.png)

The menu item does not have a class `.item`, but rather the compiled class name `Menu__item--3FNtb` which of course is why our specific rule from earlier was not used. Sure, our CSS rule may have won the specificity battle, but no element had this class name!
For our rule to be picked up, we would need it to be compiled into the HTML, alongside the Menu classes.

## Attempts
So how can we change the CSS of the menu items?
#### Global CSS?
 We could add rules to global CSS. But this a messy approach that bypasses the intended pattern of CSS Modules. We would begin to lose the benefits of scoped css modules.


#### Wrap the element?
If we are struggling to target a class inside the menu, we could simply wrap the menu in another element, and apply extra styles to that. This works well for things like layout, but in our case, trying to target an `::after` selector on a nested element, a solution like the following would not be possible.
```jsx
//header.js
<header className={menu}>
  <div className={extraMenuStyles}
    </ Menu>
  </div>
</header>
```

#### Two components?
You can argue that if we want two different types of menus, then why don't we have two different components? For many cases, this is indeed the correct solution - sometimes components that look similar
actually represent different concepts and should indeed be separated.
In this case however, I deemed the menus to represent the same concept, and I wanted them to be the same component.

#### Smart Menu component?
What if the Menu component knew where it was being rendered? It could then display the separators by default, and hide them if it displayed in the Header. While this is nice in the short term it means our
component is no longer 'dumb', it has to deal with things it should not have to worry about. We want our menu to give a menu, and then be done with it.

## A solution:
Our attempt at specifity failed because our Header.css rule, was not compiled into the HTML for the Menu.


So let's add it to our HTML element!

Menu items will aways have the `.items` class defined in Menu.css,
but when rendered from the Header, it will also have the `.items` class that was defined in Header.css.
We can pass the class, defined in Header.css, into Menu.css, a pattern which  x called the [adopted child pattern](http://simurai.com/blog/2015/05/11/nesting-components).

We pass menu our `.items` class from Header:
```jsx
//header.js
import { item } from './Header.css'
...
<header>
    <Menu classes={{ item }}></Menu>
  </div>
</header>
```
Menu.js accepts these extra classes and applies them to each menu item.
```jsx
//menu.js
import classNames from 'classnames'

const Menu = ({ className, classes = {}}) => (
  <div className={menu}>
    <button className={classNames(item, classes.item)}>HOME</button>
    <button className={classNames(item, classes.item)}>STORE</button>
    <button className={classNames(item, classes.item)}>CONTACT</button>
  </div>
)
```


As the class belongs to Header.css it will still be compiled in the Header.css namespace, i.e. `Header_item--rEJh` but with this approach we will ensure that `Header_item--rEJh` is a class on our HTML element.


![compiled menu and header scoped classes](/images/posts/overriding-styles-in-CSS-modules/compiled-with-header-classes.46.20.png){:border="1px solid black"}


Now we have two item classes on our element.  `Menu_item--rEJh` and `Header_item--rEJh`. Which class will win? Our old friend specificity will determine that!

And the winner is ....
`Header_item--rEJh`
![menu with no separators between items](/images/posts/overriding-styles-in-CSS-modules/menu-not-separated.png)


We have successfully overridden a style using CSS modules.


## What's next?
So we found a way to override styles when using CSS Modules. But should we be doing this? Short answer: Only if there's not an easier way. There are many ways you can change styles that are simpler than this approach. But in scenarios like ours where we are overriding an inner element I believe this is the tidiest solution that keeps our CSS modular. A [CSS-Modules proposal](https://github.com/css-modules/css-modules/issues/147) is in the works that will introduce a keyword `external` to solve these cases where an outer component needs to override the styles of an inner component. It's a recommended read with some interesting discussions.


Have you had this problem? How did you solve it? Let us know your thoughts in the comments below!
