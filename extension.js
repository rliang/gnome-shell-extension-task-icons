const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;

let _iconsBox, _handles;

function getWorkspaces() {
  let wsList = [];
  for (let i = 0; i < global.screen.n_workspaces; i++)
    wsList.push(global.screen.get_workspace_by_index(i));
  return wsList;
}

function getAppIcons(ws) {
  return ws.list_windows()
    .map(win => Shell.WindowTracker.get_default().get_window_app(win))
    .filter(app => app != null)
    .map(app => new St.Bin({
      style_class: 'taskicons-icon',
      child: app.create_icon_texture(16),
    }));
}

function createBox(wsIndex, icons, wsListLength) {
  let box = new St.BoxLayout({
    style_class: 'panel-button',
    reactive: true,
    can_focus: true,
    track_hover: true,
  });
  box.connect('button-press-event', () =>
    global.screen.get_workspace_by_index(wsIndex)
    .activate(global.get_current_time()));
  if (wsListLength > 1 || wsIndex != global.screen.get_active_workspace_index())
    box.add(new St.Label({
      style_class: 'taskicons-label',
      text: (wsIndex + 1).toString(),
      y_align: Clutter.ActorAlign.CENTER,
    }));
  icons.forEach(i => box.add(i));
  return box;
}

function rebuild() {
  _iconsBox.destroy_all_children();
  if (global.get_window_actors().length > 2)
    getWorkspaces().map(ws => [ws, getAppIcons(ws)])
    .filter(([ws, icons]) => icons.length > 0)
    .forEach(([ws, icons], i, wsList) =>
      _iconsBox.add(createBox(ws.index(), icons, wsList.length)));
}

function enable() {
  _iconsBox = new St.BoxLayout({ style_class: 'taskicons-box' });
  let appMenu = Main.panel.statusArea.appMenu.actor.get_parent();
  let appMenuBox = appMenu.get_parent();
  let appMenuIndex = appMenuBox.get_children().indexOf(appMenu);
  appMenuBox.insert_child_at_index(_iconsBox, appMenuIndex + 1);
  rebuild();
  _handles = ['map', 'destroy', 'switch-workspace']
    .map(s => global.window_manager.connect(s, () => Mainloop.idle_add(rebuild)));
}

function disable() {
  _handles.forEach(h => global.window_manager.disconnect(h));
  _iconsBox.destroy();
}
