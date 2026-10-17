package com.labmonitoramento.dashboard;

import android.content.Intent;
import android.util.Log;
import com.getcapacitor.CapConfig;
import com.getcapacitor.BridgeActivity;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONException;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {

	static final String EXTRA_SERVER_IP = "com.labmonitoramento.dashboard.SERVER_IP";
	static final String EXTRA_SERVER_ERROR = "com.labmonitoramento.dashboard.SERVER_ERROR";

	@Override
	protected void load() {
		if ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
			String serverIp = getIntent().getStringExtra(EXTRA_SERVER_IP);
			if (!isValidIpv4(serverIp)) {
				showServerSetup(null);
				return;
			}
			try {
				config = createServerConfig("http://" + serverIp + ":5173");
				super.load();
			} catch (IOException | JSONException | RuntimeException error) {
				Log.e("MainActivity", "Could not initialize dashboard bridge", error);
				String detail = error.getMessage();
				if (detail == null || detail.isEmpty()) detail = error.getClass().getSimpleName();
				showServerSetup(detail);
			}
			return;
		}
		super.load();
	}

	private void showServerSetup(String error) {
		Intent intent = new Intent(this, ServerSetupActivity.class);
		if (error != null) intent.putExtra(EXTRA_SERVER_ERROR, error);
		startActivity(intent);
		finish();
	}

	private CapConfig createServerConfig(String serverUrl) throws IOException, JSONException {
		byte[] configBytes;
		try (InputStream input = getAssets().open("capacitor.config.json"); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
			byte[] buffer = new byte[4096];
			int bytesRead;
			while ((bytesRead = input.read(buffer)) != -1) {
				output.write(buffer, 0, bytesRead);
			}
			configBytes = output.toByteArray();
		}

		JSONObject capacitorConfig = new JSONObject(new String(configBytes, StandardCharsets.UTF_8));
		JSONObject serverConfig = capacitorConfig.optJSONObject("server");
		if (serverConfig == null) serverConfig = new JSONObject();
		serverConfig.put("url", serverUrl);
		serverConfig.put("cleartext", true);
		capacitorConfig.put("server", serverConfig);

		File configDirectory = new File(getCacheDir(), "capacitor-config");
		if (!configDirectory.exists() && !configDirectory.mkdirs()) {
			throw new IOException("Could not create temporary Capacitor config directory");
		}
		File configFile = new File(configDirectory, "capacitor.config.json");
		try (FileOutputStream output = new FileOutputStream(configFile)) {
			output.write(capacitorConfig.toString().getBytes(StandardCharsets.UTF_8));
		}
		return CapConfig.loadFromFile(this, configDirectory.getAbsolutePath());
	}

	static boolean isValidIpv4(String address) {
		if (address == null || address.isEmpty()) return false;
		String[] octets = address.split("\\.", -1);
		if (octets.length != 4) return false;
		for (String octet : octets) {
			if (octet.isEmpty() || octet.length() > 3) return false;
			for (int index = 0; index < octet.length(); index++) {
				if (!Character.isDigit(octet.charAt(index))) return false;
			}
			try {
				if (Integer.parseInt(octet) > 255) return false;
			} catch (NumberFormatException error) {
				return false;
			}
		}
		return true;
	}
}
