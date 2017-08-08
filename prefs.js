const GLib           = imports.gi.GLib;
const Gio            = imports.gi.Gio;
const Gtk            = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;

let _configs;

function buildPrefsWidget() {
  const main = new Gtk.Box({
    expand: true,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    margin: 6,
    spacing: 6,
    orientation: Gtk.Orientation.VERTICAL
  });
  _configs.settings_schema.list_keys().forEach(name => {
      const key = _configs.settings_schema.get_key(name);
      const box = new Gtk.Box({hexpand: true});
      main.add(box);
      box.pack_start(new Gtk.Label({
        label:        key.get_summary(),
        tooltip_text: key.get_description(),
      }), false, false, 6);
      const val = new Gtk.Entry({text: _configs.get_value(name).print(false)});
      const typ = key.get_value_type();
      val.connect('changed', () => {
        try {
          _configs.set_value(name, GLib.Variant.parse(typ, val.text, null, null));
        } catch (_) {}
      });
      box.pack_end(val, false, false, 6);
      box.pack_end(new Gtk.Label({label: '@' + typ.dup_string()}), false, false, 6);
    });
  main.show_all();
  return main;
}

function init() {
  const me = ExtensionUtils.getCurrentExtension();
  const ss = Gio.SettingsSchemaSource.new_from_directory(
      me.dir.get_path(), Gio.SettingsSchemaSource.get_default(), false);
  _configs = new Gio.Settings({
    settings_schema: ss.lookup(me.metadata['settings-schema'], true)
  });
}
