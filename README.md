# gnome-shell-extension-task-icons

Adds task icons grouped by workspace to the panel.


# Screenshots

Default

![](screenshot-1.png)

`workspace-numbers-position=0`

![](screenshot-2.png)

`panel-box='_centerBox'`

![](screenshot-3.png)

`workspaces-before-active-position=1`

`workspaces-after-active-position=2`

`active-workspace-position=nothing`

![](screenshot-4.png)


# Installation

### From GNOME Shell Extensions

Install from [here](https://extensions.gnome.org/extension/1175/task-icons/), or use the command `gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Extensions.InstallRemoteExtension "'taskicons@rliang.github.com'"`

### From source

```
git clone https://github.com/rliang/gnome-shell-extension-task-icons ~/.local/share/gnome-shell/extensions/taskicons@rliang.github.com
gnome-shell-extension-tool -e taskicons@rliang.github.com
```
