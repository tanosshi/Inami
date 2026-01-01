// dont take this as actual code quality reference lol everything here will be scraped
import React, { useState } from "react";
import SettingsModal from "./settings/modal-[id]";
import { ImportUrlModal, FolderScanModal } from "../components/songs/modals";
import { CreatePlaylistModal } from "../components/playlists/modals";
import { View } from "react-native";

export default function Sandbox() {
  // Demo state for ImportUrlModal
  const [showImportModal, setShowImportModal] = useState(true);
  const [importUrl, setImportUrl] = useState("https://hi.com");
  const [importTitle, setImportTitle] = useState("hello playlsit");
  const [importing, setImporting] = useState(false);
  const ImportURL = () => {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setShowImportModal(false);
    }, 1000);
  };

  const [showCreateModal, setShowCreateModal] = useState(true);
  const [playlistName, setPlaylistName] = useState("another plalist");
  const [playlistDescription, setPlaylistDescription] = useState(
    "yayy i made a plalist."
  );
  const [creating, setCreating] = useState(false);
  const CreatePlaylist = () => {
    setCreating(true);
    setTimeout(() => {
      setCreating(false);
      setShowCreateModal(false);
    }, 1000);
  };

  const [scanningFolder] = useState(true);
  const [scanProgress] = useState({ current: 5, total: 10 });

  return (
    <View style={{ flex: 1 }}>
      <ImportUrlModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        importUrl={importUrl}
        setImportUrl={setImportUrl}
        importTitle={importTitle}
        setImportTitle={setImportTitle}
        importing={importing}
        onImport={ImportURL}
      />
      <CreatePlaylistModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        playlistName={playlistName}
        setPlaylistName={setPlaylistName}
        playlistDescription={playlistDescription}
        setPlaylistDescription={setPlaylistDescription}
        creating={creating}
        onCreate={CreatePlaylist}
      />
      <FolderScanModal show={scanningFolder} scanProgress={scanProgress} />
      <SettingsModal
        visible={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Apply Theme"
        message="Are you sure you want to apply this theme?"
        confirmText="Yes"
        cancelText="Cancel"
      />
    </View>
  );
}
