package com.labmonitoramento.dashboard;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class ServerSetupActivity extends AppCompatActivity {

	private static final String SERVER_PREFERENCES = "dashboard_server";
	private static final String SERVER_IP_KEY = "server_ip";

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_server_setup);

		EditText serverIpInput = findViewById(R.id.server_ip_input);
		TextView errorMessage = findViewById(R.id.server_ip_error);
		Button connectButton = findViewById(R.id.server_connect_button);
		SharedPreferences preferences = getSharedPreferences(SERVER_PREFERENCES, MODE_PRIVATE);
		serverIpInput.setText(preferences.getString(SERVER_IP_KEY, ""));

		String startupError = getIntent().getStringExtra(MainActivity.EXTRA_SERVER_ERROR);
		if (startupError != null) {
			errorMessage.setText(getString(R.string.server_start_failed, startupError));
			errorMessage.setVisibility(View.VISIBLE);
		}

		connectButton.setOnClickListener(view -> {
			String serverIp = serverIpInput.getText().toString().trim();
			if (!MainActivity.isValidIpv4(serverIp)) {
				errorMessage.setText(R.string.server_invalid_ip);
				errorMessage.setVisibility(View.VISIBLE);
				return;
			}

			preferences.edit().putString(SERVER_IP_KEY, serverIp).apply();
			Intent intent = new Intent(this, MainActivity.class);
			intent.putExtra(MainActivity.EXTRA_SERVER_IP, serverIp);
			startActivity(intent);
			finish();
		});
	}
}