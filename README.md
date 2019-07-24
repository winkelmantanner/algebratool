### Algebra Tool

Try it out:
[winkelmantanner.github.io/algebratool](https://winkelmantanner.github.io/algebratool)

It is possible to solve obscenely complicated systems of equations using this tool.

I made this tool because I had this system:
```
-w+s*z+a*(z-y)+(z-y)*b=0 &
c*y+x*y+b*(y-z)+a*(y-z)=0 &
(z-y)*b-y*x=v12
```
and the goal was to eliminate y and z and solve for x.

I could not solve that system with any tool I could find, so I made Algebra Tool, and I was able to solve that system.  It took me over 300 button presses, but no other tool could do it at all.  My solution is over 100 characters long.

Update: The Python library SymPy was able to get a much simpler solution than I got with Algebra Tool.  I used SymPy's nonlinsolve function.  It solved the system in like 5 seconds.
