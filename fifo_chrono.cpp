#include <iostream>
#include <vector>
#include <algorithm>
#include <iomanip>
#include <chrono>
#include <string>
#include <thread>
using namespace std;

struct Proceso {
    int id, llegada, ejecucion;
    int inicio = 0, final = 0;
    int retorno = 0, espera = 0;
};

// Este calculo se ejecuta en un hilo trabajador.
void calcularFIFO(vector<Proceso>& p, double& sumaRetorno, double& sumaEspera) {
    stable_sort(p.begin(), p.end(),
        [](const Proceso& a, const Proceso& b) {
            return a.llegada < b.llegada;
        });

    int tiempo = 0;
    for (auto& proceso : p) {
        proceso.inicio = max(tiempo, proceso.llegada);
        proceso.final = proceso.inicio + proceso.ejecucion;
        proceso.retorno = proceso.final - proceso.llegada;
        proceso.espera = proceso.inicio - proceso.llegada;

        tiempo = proceso.final;
        sumaRetorno += proceso.retorno;
        sumaEspera += proceso.espera;
    }
}

int main() {
    // MODIFICA LOS PROCESOS AQUI: {id, llegada, ejecucion}
    vector<Proceso> p = {
        {1, 0, 8},
        {2, 1, 4},
        {3, 2, 9},
        {4, 3, 5}
    };

    if (p.empty()) {
        cerr << "Agrega al menos un proceso.\n";
        return 1;
    }
    for (const auto& proceso : p) {
        if (proceso.llegada < 0 || proceso.ejecucion <= 0) {
            cerr << "Llegada debe ser >= 0 y ejecucion > 0.\n";
            return 1;
        }
    }

    double sumaRetorno = 0, sumaEspera = 0;
    auto inicioCrono = chrono::steady_clock::now();

    // Hilo real: ejecuta el algoritmo FIFO en segundo plano.
    thread trabajador(calcularFIFO, ref(p), ref(sumaRetorno), ref(sumaEspera));
    trabajador.join();  // Espera a que termine antes de mostrar resultados.

    double promedioRetorno = sumaRetorno / p.size();
    double promedioEspera = sumaEspera / p.size();
    auto finCrono = chrono::steady_clock::now();
    double duracion = chrono::duration<double, micro>(
        finCrono - inicioCrono
    ).count();

    cout << left
         << setw(12) << "Proceso"
         << setw(12) << "Llegada"
         << setw(12) << "Ejecucion"
         << setw(12) << "Inicio"
         << setw(12) << "Final"
         << setw(12) << "Retorno"
         << setw(12) << "Espera" << "\n";

    cout << string(84, '-') << "\n";

    for (const auto& proceso : p) {
        cout << left
             << setw(12) << ("P" + to_string(proceso.id))
             << setw(12) << proceso.llegada
             << setw(12) << proceso.ejecucion
             << setw(12) << proceso.inicio
             << setw(12) << proceso.final
             << setw(12) << proceso.retorno
             << setw(12) << proceso.espera << "\n";
    }

    cout << fixed << setprecision(2);
    cout << "\nRetorno promedio: " << promedioRetorno;
    cout << "\nEspera promedio:  " << promedioEspera;
    cout << "\nTiempo real:      " << duracion << " microsegundos\n";
    return 0;
}
