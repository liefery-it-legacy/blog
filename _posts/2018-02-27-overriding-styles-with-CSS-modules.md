---
layout: post
title: "Overriding styles with CSS Modules: Where's my specificity? "
date: 2018-05-07
author: Ali Churcher
tags: CSS-modules, CSS, React, JavaScript, Component
---
[menu]: /images/posts/overriding-styles-with-CSS-modules/menu-not-separated.png
[menu-separated]: /images/posts/overriding-styles-with-CSS-modules/menu-separated.png

[CSS modules](https://github.com/css-modules/css-modules) are a clever build step that allows you to write CSS in a clean manageable way.
No longer do you have gigantic CSS files. 
No longer are you scared to delete CSS rules, for fear of unexpected style changes in murky corners of your application. No longer do you have extremely long CSS rules with multiple classes, divs, or the dreaded `!important` declarations.

With CSS-Modules you can write small and simple CSS files. By default each module has its own scope, allowing you to define duplicated CSS rules such as `.button` in several different modules. Your build tools, such as `css-loader` take care of scoping and naming issues during compilation. CSS modules let you forget about complex naming systems and, for the most part, specificity.


After some joyful months of using CSS Modules I suddenly found myself longing for my old friend specificity. I set out to find out if my longing was a code smell, a limitation of CSS Modules, or something else.

## The component

Let’s say we have a reusable menu component that is used on every page of the application. It looks something like this:

![menu with separators between items][separated-Menu]

The component has an outer div, containing three menu items, each with the class `item`
```jsx
// Menu.jsx
import { item, container } from '..Menu.css'
...

<div className={container}>
  <button className={item}>HOME</button>
  <button className={item}>STORE</button>
  <button className={item}>CONTACT</button>
</div>
```
The CSS rule `item` uses `::after` to create the pseudo-element that adds the vertical separator after the menu items.
```css
/* Menu.css */
.item::after {
  content: '|';
}
```
So far so good.
## The special case

As with all applications, we have a special case. When the Menu is inside a Header we want to remove the separator lines like this:
 
![menu with no separators between items]

To achieve this we need a CSS rule that is only used on Menus that are inside the Header.
The CSS will remove the separator and replace it with empty content:
```css
/* Header.css  replaces the separator with nothing */
.item::after {
  content: ' ';
}
```
This rule will need to be used rather than the default rule that the Menu component defines. This sounds like a job for our friend specificity.

## The attempt at overriding a rule

Let's try it. The basic principles of CSS tell me that if I want my rule to be picked up then it needs to be more specific than the other rules with the same name. If I simply make a new rule, that is more specific of course it will be used  ...right?

```css
/* Menu.css */
.item::after { /* existing rule */
  content: '|';
}
```
```css
/* Header.css */
.menu.item::after { /* more specific new rule */
  content: '|';
}
```
With two classes, the selector `.menu.item` defined in the Header.css is much more specific than the `.item` we have defined in Menu.css. But does it work?


![menu with separators between items][separated-Menu]


 No.


We still have separators. Our more specific CSS is not being used.


Don't be sad though, this is how things should be when we use CSS Modules. All the glory of CSS Modules comes from the amazing ability to scope CSS classes uniquely. The reason you are allowed to define a `button` class in several components is because these classes, once compiled are given scoped names with a unique hash. If we use our developer tools to look at
the Menu, we can see this happening in action with our `item` class:


![compiled menu scoped classes](/images/posts/overriding-styles-with-CSS-modules/compiled-menu-classes.png){:class="dev-tools-image"}


The menu items do not have the class `item`. Instead, they have been given the compiled class name `Menu__item--3FNtb`. Sure, our CSS rule may have won the specificity battle, but no element had this class name!
For our rule to be picked up, we would need its compiled name in the HTML, alongside the Menu classes.


## Stepping back for a second
Having an HTML element with classes form two different modules sounds complicated. Maybe there are simpler solutions to override styles.

#### Wrap the element?
If we are struggling to target a class inside the menu, we could simply wrap the menu in another element, and apply extra styles to that:
```jsx
//Header.jsx
<header>
  <div className={extraMenuStyles} // wrapper element with styles
    < Menu />
  </div>
</header>
```
This works well for things like layout, but in our case, trying to target an `::after` selector on a nested element, a solution like the following would not be possible.

#### Two components?
You can argue that if we want two different types of menus, then why don't we have two different components? For many cases, this is indeed the correct solution - sometimes components that look similar
actually represent different concepts and should indeed be separated.
In this case however, the menus to represent the same concept, and I wanted them to be the same component.

#### Smart Menu component?
What if the Menu component knew where it was being rendered? It could then display the separators by default, and hide them if it displayed in the Header. While this is nice in the short term it means our
component is no longer 'dumb', it has to deal with things it should not have to worry about. We want our menu to provide  menu, and then be done with it.

#### Global CSS?
 When all else fails we could add rules to global CSS. While useful for site-wide styes, this option is not good for contained components like our Menu. We would bypass the intended pattern of CSS Modules and begin to lose the benefits of scoped CSS.

## A solution
Our initial attempt at specificity failed because our Header.css rule, was not compiled into the HTML for the Menu. So let's find a way to add it to our HTML element. For our new CSS rule to be added to the HTML it needs to be present in Menu.jsx. To achieve this, we can pass the rule in from the Header.jsx component.

When the header renders the Menu we pass our new item rule:
```jsx
//Header.jsx
import { item } from './Header.css'
...

<header>
  {% raw %}<Menu classes={{item}}></Menu>{% endraw %}
</header>
```
Menu.jsx accepts these extra classes and applies them to each menu item.
```jsx
//Menu.jsx
import cn from 'classnames'
...

const Menu = ({ className, classes = {}}) => (
  <div className={className}>
    <button className={cn(item, classes.item)}>HOME</button>
    <button className={cn(item, classes.item)}>STORE</button>
    <button className={cn(item, classes.item)}>CONTACT</button>
  </div>
)
```

Menu items will still have the `item` class defined in Menu.css,
but when rendered from the Header, they will also have the `item` class that was defined in Header.css.
 This pattern of an HTML element sharing classes from two different components is defined as the [Adopted Child Pattern](http://simurai.com/blog/2015/05/11/nesting-components) by Simurai.

As the class belongs to Header.css it will still be compiled in the Header namespace.




![compiled menu and header scoped classes](/images/posts/overriding-styles-with-CSS-modules/compiled-with-header-classes.46.20.png){:class="dev-tools-image"}




Now we have two item classes on our element.  `Menu_item--3FNtb` and `Header_item--1NKCj`. So which styles will be used? Our old friend specificity will determine that!

![menu with no separators between items][menu]

The header styles, that remove the separator has won.
We have successfully used specificity to override a style using CSS Modules.


## What's next?
Wanting a parent component to alter the styles of a child component turns out to not be such a rare scenario. Thankfully there is a great discussion in progress and a new [CSS-Modules proposal](https://github.com/css-modules/css-modules/issues/147) to make this issue simpler with the introduction of a new `:external` keyword in CSS. The proposal is a recommended read with some interesting discussions. In the mean time, always go for the simplest solution, and know that your old friend specificity is always there for you.


_Have you had this problem? How did you solve it? Let us know your thoughts in the comments below!_
