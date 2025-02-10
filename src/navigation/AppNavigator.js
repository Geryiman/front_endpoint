import React, { useRef } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import PhotoScreen from "../screens/PhotoScreen";
import TreatmentsScreen from "../screens/TreatmentsScreen";
import AlarmsScreen from "../screens/AlarmsScreen";
import ActiveAlarmScreen from "../screens/ActiveAlarmScreen";


const Stack = createStackNavigator();
export const navigationRef = React.createRef();

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="LoginScreen">
        <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ title: "Iniciar Sesión", headerShown: false }} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} options={{ title: "Registro" }} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: "Inicio" }} />
        <Stack.Screen name="PhotoScreen" component={PhotoScreen} options={{ title: "Fotos" }} />
        <Stack.Screen name="TreatmentsScreen" component={TreatmentsScreen} options={{ title: "Tratamientos" }} />
        <Stack.Screen name="AlarmsScreen" component={AlarmsScreen} options={{ title: "Alarmas" }} />
        <Stack.Screen name="ActiveAlarmScreen" component={ActiveAlarmScreen} options={{ title: "Alarma Activa", headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
