const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;

let _box, _handles = [];

function _build() {
  _box.destroy_all_children();
  if (global.get_window_actors().length < 2)
    return;
  let wss = [];
  for (let i = 0; i < global.screen.n_workspaces; i++)
    wss.push(global.screen.get_workspace_by_index(i));
  wss.map(ws => [
    ws.index(),
    ws.list_windows()
      .map(win => Shell.WindowTracker.get_default().get_window_app(win))
      .filter(app => app != null)
      .map(app => new St.Bin({
        style_class: 'taskicons-icon',
        child: app.create_icon_texture(16),
      })),
  ]).filter(([i, icons]) => icons.length > 0)
    .forEach(([i, icons], j, all) => {
      let wsbox = new St.BoxLayout({
        style_class: 'panel-button',
        reactive: true,
        can_focus: true,
        track_hover: true,
      });
      wsbox.connect('button-press-event', () =>
        ws.activate(global.get_current_time()));
      if (all.length > 1)
        wsbox.add(new St.Label({
          style_class: 'taskicons-label',
          text: (i + 1).toString(),
          y_align: Clutter.ActorAlign.CENTER,
        }));
      icons.forEach(ic => wsbox.add(ic));
      _box.add(wsbox);
    });
}

function enable() {
  _box = new St.BoxLayout({style_class: 'taskicons-box'});
  let appmenu = Main.panel.statusArea.appMenu.actor.get_parent();
  let appmenubox = appmenu.get_parent();
  let appmenuindex = appmenubox.get_children().indexOf(appmenu);
  appmenubox.insert_child_at_index(_box, appmenuindex + 1);
  _build();
  _handles.push([
    global.screen,
    global.screen.connect('workspace-switched', () => Mainloop.idle_add(_build)),
  ]);
  _handles.push([
    global.display,
    global.display.connect('notify::focus-window', () => Mainloop.idle_add(_build)),
  ]);
}

function disable() {
  _handles.forEach(([obj, handle]) => obj.disconnect(handle));
  _handles = [];
  _box.destroy();
}
