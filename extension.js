const Meta = imports.gi.Meta;
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
  let active = wsIndex === global.screen.get_active_workspace_index();
  let multiple = wsListLength > 1;
  let box = new St.BoxLayout({
    style_class: 'panel-button',
    pseudo_class: multiple && active ? 'active' : null,
    reactive: true,
    can_focus: true,
    track_hover: true,
  });
  box.connect('button-press-event', () =>
    global.screen.get_workspace_by_index(wsIndex)
      .activate(global.get_current_time()));
  if (multiple || !active)
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
  let all = global.get_window_actors()
    .map(a => a.meta_window)
    .filter(w => w.window_type === Meta.WindowType.NORMAL);
  if (all.length < 1)
    return;
  if (all.length === 1 && all[0].get_workspace() == global.screen.get_active_workspace())
    return;
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
