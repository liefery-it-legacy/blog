---
layout: post
title: "Overriding styles with CSS Modules: Where's my specificity? "
date: 2018-06-27
author: Ali Churcher
tags: CSS-Modules, CSS, React, JavaScript, Component
---

[menu]: /images/posts/overriding-styles-with-CSS-modules/menu-not-separated.png
[menu-separated]: /images/posts/overriding-styles-with-CSS-modules/menu-separated.png
I'm a fan of [CSS Modules](https://github.com/css-modules/css-modules). This clever build step allows you to write CSS in a clean, manageable way. No longer do you have gigantic CSS files. No longer are you scared to delete CSS rules, for fear of unexpected style changes in murky corners of your application. No longer do you have to implement complex CSS naming schemes that are slowly forgotten or implemented inconsistently.

We get these benefits when we use CSS Modules because we write small and simple CSS files. Each of these files (modules) has its own scope, allowing you to reuse simple class names like `button` in several different modules. Build tools such as [css-loader](https://github.com/webpack-contrib/css-loader#modules) for Webpack then take care of scoping and naming issues during compilation. These scoped class names let you forget about complex selectors, and for the most part [specificity](https://css-tricks.com/specifics-on-css-specificity/).

 After some joyful months of using CSS Modules a seemingly simple problem stumped me, and I found myself longing for my old friend specificity. I set out to find out if my longing was a code smell, a limitation of CSS Modules, or something else.

## The seemingly simple problem

In our application we have a reusable menu component that is used on every page. In reality it contains some very long German words, but let's pretend for now that it looks like this:

![menu with separators between items][menu-separated]

This menu component has an outer div, containing three menu items, each with the class `item`.
```jsx
// Menu.jsx
import { item, menu } from '..Menu.css'
...

const Menu = () => (
  <div className={menu}>
    <button className={item}>HOME</button>
    <button className={item}>STORE</button>
    <button className={item}>CONTACT</button>
  </div>
)

export default Menu
```
To create the pipe separator between the items we are using the pseudo element `::after`.
```css
/* Menu.css */
.item::after {
  content: '|';
}
```
So far so good.
## The special case

As with all applications, we have a special case. When the menu is inside a Header we want to remove the separator lines:
 
![menu with no separators between items][menu]

To achieve this we can create a CSS rule in Header.css that
will remove the separator and replace it with empty content:
```css
/* Header.css  replaces the separator with nothing */
.item::after {
  content: ' ';
}
```
When the menu is inside a Header we need this new rule to be used. It must override our existing rule from Menu.css.


This sounds like a job for specificity.

## The attempt at overriding a CSS rule

Let's try it. The principles of specificity tell me that if I want my `content` declaration to be implemented by the browser then its selector (i.e. `.item::after`) must have the highest specificity. If I simply make a new rule that is more specific of course it will be used  ...right?

```css
/* Menu.css */
.item::after { /* existing rule */
  content: '|';
}
```
```css
/* Header.css */
.menu .item::after { /* new rule with more specific selector */
  content: ' ';
}
```
With two classes, the selector `.menu .item::after` defined in the Header.css is much more specific than the `.item::after` we have defined in Menu.css. But does it work?


![menu with separators between items][menu-separated]


 No.

We still have separators. Our more specific CSS is not being used. Don't be sad though, this is exactly how things should behave when we use CSS Modules! All the glory of CSS Modules comes from the amazing ability to scope CSS classes uniquely. The reason you are allowed to reuse `button` classes in several components is because these classes, once compiled, are given scoped names with a unique hash. If we use our developer tools to look at
the menu, we can see this happening to the menu's `item` class:


![compiled menu scoped classes](/images/posts/overriding-styles-with-CSS-modules/compiled-menu-classes.png){:class="dev-tools-image"}


The menu item elements do not have the class `item`. Instead, they have been given the compiled class name `Menu__item--3FNtb`. Likewise the CSS itself is also compiled with a new name.
```css
.Menu__item--3FNtb::after {
  content: '|';
}

.Header__item--1NKCj::after {
  content: ' ';
}
```
So while our CSS rule may have won the specificity battle, no element had this class name!
For our rule to be picked up, we would need its compiled name `.Header__item--1NKCj` to be present in the HTML menu item elements.


## Stepping back for a second
Getting compiled class names from two different CSS modules into an HTML element sounds complicated. Maybe there are simpler solutions to override our separator style.

#### Wrap the element?
If we are struggling to target a class inside our menu, could we simply wrap the menu in another element, and apply extra styles to that?
This approach works well for things like positioning the menu, but for trying to target an `::after` selector on a nested element this solution will fail.

#### Two components?
You can argue that if we want two different types of menus, then we should have two different components. Sometimes components that look similar
actually represent different concepts and should indeed be separated.
In this case however, the menus represent the same concept, and I wanted them to be the same component.

#### Smart menu component?
What if the menu component knew where it was being rendered? It could then display the separators by default, and hide them if it was rendered from the Header component. While this is easy in the short term it means our
component is no longer 'dumb', it has to deal with things it should not have to worry about. We want our menu to provide a menu, and then be done with it.

#### Global CSS?
 If all else fails we could add our rule to the global CSS. However, while useful for site-wide styles, global CSS is not a good solution for contained components like our menu. We would start to lose the benefits of scoped CSS.

## A solution
So we just eliminated many of the common solutions and alternatives for overriding the CSS of a child component from the parent component. It's time to reapproach the idea of adding the compiled class from Header.css into each of our menu item elements.
We know that for our new Header.css rule to be added to the HTML it needs to be present in Menu.jsx when it is compiled. This is something we can achieve by passing the rule into the menu from the Header.

When the header renders the menu we pass in our new `.item` rule:
```jsx
//Header.jsx
import Menu from '../Menu.jsx'
import { item } from './Header.css' // rule to REMOVE the separators
...

const Header = () => (
  <header>
    {% raw %}<Menu classes={{ item }} />{% endraw %}
  </header>
)

export default Header
```
The menu component accepts this extra class from the Header component and applies it to each menu item. We are using the classnames library `cn` to allow us to add multiple classes to the element: the `item` class from Menu.css, and the `item` class from Header.css. In fact any component that renders a menu now has this option to provide its own implementation of `.item`.
```jsx
//Menu.jsx
import { menu item } from './Menu.css' // rule to ADD the separators
import cn from 'classnames'
...

const Menu = ({ classes = {} }) => (
  <div className={menu}>
    <button className={cn(item, classes.item)}>HOME</button>
    <button className={cn(item, classes.item)}>STORE</button>
    <button className={cn(item, classes.item)}>CONTACT</button>
  </div>
)

export default Menu
```
Let's check the developer tools to see if these classes are really added:


![compiled menu and header scoped classes](/images/posts/overriding-styles-with-CSS-modules/compiled-with-header-classes.png){:class="dev-tools-image"}


Looks good! Now we have both `Menu_item--3FNtb` and `Header_item--1NKCj` on our elements.
 One class adds a separator, one class takes it away. So which style with the browser choose? Will specificity come back to us and allow our more specific Header.css style to win?


 Let's see if we managed to remove the separators.

![menu with no separators between items][menu]

Yes!

The header styles that remove the separator has won.
We have successfully used specificity to override a style using CSS Modules.
 This pattern of an HTML element sharing classes from two different components is defined as the [Adopted Child Pattern](http://simurai.com/blog/2015/05/11/nesting-components) by Simurai.


## What's next?
Wanting a parent component to override the styles of a child component turns out to be a common issue in the community. Thankfully a new `:external` keyword has been proposed to ease the pain. I recommend reading the [proposal](https://github.com/css-modules/css-modules/issues/147) for some interesting discussions on the topic. In the mean time, always go for the simplest solution, and know that your friend specificity is always there for you.


_Have you had this problem? How did you solve it? Let us know your thoughts in the comments!_
