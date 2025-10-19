import { StyleSheet } from 'react-native';

export const componentStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 10,
    marginBottom: 5,
  },
  inputContainer: {
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  input: {
    minHeight: 80,
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  btnGuardar: {
    backgroundColor: '#059669', // Verde para guardar
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnGuardarDisabled: {
    backgroundColor: '#9ca3af', // Gris si está sincronizando
  },
  btnTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lista: {
    marginTop: 10,
  },
  notaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#3b82f6', // Borde azul
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.0,
    elevation: 1,
  },
  notaContent: {
    flex: 1,
    paddingRight: 10,
  },
  notaTexto: {
    fontSize: 16,
    marginBottom: 5,
    color: '#1f2937',
  },
  notaFecha: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  btnEliminar: {
    backgroundColor: '#ef4444', // Rojo para eliminar
    padding: 8,
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnEliminarTexto: {
    fontSize: 18,
  },
  textoVacio: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#6b7280',
  },
});

// Estilos del Modal Personalizado (CustomModal)
export const modalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Fondo semitransparente
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 12,
        padding: 25,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%',
        maxWidth: 400,
    },
    modalTitle: {
        marginBottom: 15,
        textAlign: "center",
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    modalText: {
        marginBottom: 20,
        textAlign: "center",
        fontSize: 16,
        color: '#4b5563',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    button: {
        borderRadius: 8,
        padding: 10,
        elevation: 2,
        minWidth: 100,
        marginHorizontal: 5,
    },
    buttonConfirm: {
        backgroundColor: "#3b82f6", // Azul
    },
    buttonCancel: {
        backgroundColor: "#9ca3af", // Gris
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    }
});