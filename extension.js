const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;

let _box, _handles;

function _build() {
  _box.destroy_all_children();
  if (global.get_window_actors().length < 3)
    return;
  let wss = [];
  for (let i = 0; i < global.screen.n_workspaces; i++)
    wss.push(global.screen.get_workspace_by_index(i));
  wss.map(ws => [
      ws,
      ws.list_windows()
        .map(win => Shell.WindowTracker.get_default().get_window_app(win))
        .filter(app => app != null)
        .map(app => new St.Bin({
          style_class: 'taskicons-icon',
          child: app.create_icon_texture(16),
        })),
    ]).filter(([ws, icons]) => icons.length > 0)
    .forEach(([ws, icons], j, all) => {
      let wsbox = new St.BoxLayout({
        style_class: 'panel-button',
        reactive: true,
        can_focus: true,
        track_hover: true,
      });
      if (all.length > 1)
        wsbox.add(new St.Label({
          style_class: 'taskicons-label',
          text: (ws.index() + 1).toString(),
          y_align: Clutter.ActorAlign.CENTER,
        }));
      icons.forEach(ic => wsbox.add(ic));
      wsbox.connect('button-press-event', () =>
        ws.activate(global.get_current_time()));
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
  _handles = ['map', 'destroy', 'switch-workspace']
    .map(s => global.window_manager.connect(s, () => Mainloop.idle_add(_build)));
}

function disable() {
  _handles.forEach(h => global.window_manager.disconnect(h));
  _box.destroy();
}
